export const ROLE = {
	admin: 'admin',
	user: 'user'
}

export const adminMiddleware = (req, res, next) => {
	if(req.user.role !== ROLE.admin) {
		res.status(401);
		return res.send('Not allowed');
	}

	next();
}