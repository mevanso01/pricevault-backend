const Z = require("zebras");

class AllStrikesFunc {
  public _users;
  public _userId;
  public _trades;
  public _multify = 1.5;

  constructor(userId, trades) {
    this._userId = userId;
    this._trades = trades;
  }

  main(baseData) {
    this._users = this.getUsers(baseData);
    // If user is less than 4, cancel all calculation.
    if (this._users.length < 4) return [];
    const meanStd = this.getMeanStd(baseData);
    const userSubmission = this.getUserSubmission(baseData);
    if (userSubmission.length === 0) {
      return {
        data: [],
        xRange: []
      }
    }
    const userMeanStd = this.getUserMeanStd(meanStd, userSubmission);
    const stdAnaly = this.getStdAnalysis(userMeanStd, userSubmission);
    const stdSum = this.getStdSum(stdAnaly);
    const result = this.getFinalResult(stdSum);
    return result;
  }

  getUsers(data) {
    let users = [];
    data.map(item => users.push(item.userId));
    return users;
  }

  getConcatAll(data) {
    let concated = [];
    data.map(item => {
      concated = Z.concat(concated, item.submissions);
    })
    return concated;
  }

  getMeanStd(data) {
    const concated = this.getConcatAll(data);
    return Z.gbDescribe("valuation", Z.groupBy(d => d.tradeId, concated))
  }

  getUserSubmission(data) {
    const userData = data.find(item => item.userId == this._userId);
    return userData ? userData.submissions : [];
  }

  getUserMeanStd(allData, userData) {
    let userMeanStd = []
    allData.map(item => {
      const avgFromAll = item.mean;
      const stdFromAll = item.std;
      const submissionFromUser = userData.find(u => u.tradeId == +(item.group));
      if (submissionFromUser) {
        const valFromUser = submissionFromUser.valuation;
        const isInclueds = Math.abs(valFromUser - avgFromAll) < stdFromAll * this._multify;
        // const userAvg = isInclueds ? avgFromAll : 'wat';
        // const userstd = isInclueds ? stdFromAll : 'wat';
        const userAvg = avgFromAll;
        const userstd = stdFromAll;

        userMeanStd.push({
          tradeId: submissionFromUser.tradeId,
          mean: userAvg,
          std: userstd
        });
      }
    });

    return userMeanStd;
  }

  getStdAnalysis(data, userSubs) {
    data.forEach((item) => {
      const userSub = userSubs.find(s => s.tradeId == item.tradeId);
      const trade = this._trades.find(t => t.tradeId == item.tradeId);
      item.std = item.mean == 'wat' ? 2 : (item.std == 0 ? 0 : Math.abs((userSub.valuation - item.mean) / item.std));
      item.expiry = trade.expiry;
      item.tenor = trade.tenor;
      item.strikeRelative = trade.strikeRelative;
      item.optionType = trade.optionType;
    });
    return data;
  }

  getStdSum(data) {
    const thisOne = this;
    const result = [];
    data.forEach(function (item) {
      const findOne = result.find(x => x.expiry == item.expiry && x.tenor == item.tenor);
      if (findOne) {
        findOne.std += +(item.std);
      } else {
        result.push({
          expiry: item.expiry,
          expirySort: thisOne.getToConvertMonth(item.expiry),
          tenor: item.tenor,
          tenorSort: thisOne.getToConvertMonth(item.tenor),
          std: +(item.std)
        });
      }
    });
    return result;
  }

  getToConvertMonth(data) {
    const lastChar = data.charAt(data.length - 1);
    const number = parseInt(data);
    if (lastChar.toLowerCase() == 'm') {
      return number;
    }
    return number * 12;
  }

  getTenorRange(data) {
    const tenorUnique = new Set(data.map(item => item.tenor));
    return Array.from(tenorUnique);
  }

  getFinalResult(data) {
    const result = [];
    const sorted = Z.sort((a, b) => a.tenorSort - b.tenorSort, data);
    const sortedByName = Z.sort((a, b) => a.expirySort - b.expirySort, data);
    const tenorRange = this.getTenorRange(sorted);
    const groupObj = Z.groupBy(x => x.expiry, sortedByName);
    const AllDataRange = [];
    for (const [key, value] of Object.entries(groupObj) as any) {
      const stdArray = [];
      tenorRange.forEach((tr) => {
        const find = value.find(item => item.tenor == tr);
        if (find) {
          stdArray.push(find.std?.toFixed(2));
          AllDataRange.push(find.std?.toFixed(2));
        } else {
          stdArray.push(null);
        }
      });
      result.push({
        "name": key,
        "data": stdArray
      });
    }

    return {
      data: result,
      dataRange: Z.getRange(AllDataRange),
      xRange: tenorRange,
    }
  }
}

export = AllStrikesFunc;