const Z = require("zebras");

class SubmissionFunc {
  public _users;
  public _trades;
  constructor(data) {
    this._trades = data;
  }

  main(baseData) {
    this._users = this.getUsers(baseData);
    // If user is less than 4, cancel all calculation.
    if (this._users.length < 4) return [];
    const meanStd = this.getMeanStd(baseData);
    const stdAnaly = this.getStdAnalysis(meanStd);
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

  getStdAnalysis(data) {
    data.forEach((item) => {
      const trade = this._trades.find(t => t.tradeId == +item.group);
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
        findOne.std += +(item.std.toFixed(2));
      } else {
        result.push({
          expiry: item.expiry,
          expirySort: thisOne.getToConvertMonth(item.expiry),
          tenor: item.tenor,
          tenorSort: thisOne.getToConvertMonth(item.tenor),
          std: +(item.std.toFixed(2))
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
    for (const [key, value] of Object.entries(groupObj) as any) {
      const stdArray = [];
      tenorRange.forEach((tr) => {
        const find = value.find(item => item.tenor == tr);
        if (find) {
          stdArray.push(find.std)
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
      xRange: tenorRange
    }
  }
}

export = SubmissionFunc;