const jwt = require('jsonwebtoken');
const moment = require('moment');
const User = require('../model/users');

const apiAuth = async (req, res, next) => {
    try {
        const authorization = req.headers['authorization'];
        if(authorization) {
            const token = authorization.split('Bearer ');
            if(token[1] !== ""){
                const { userId } = jwt.verify(token[1], process.env.ACCESS_TOKEN_SECRET);
                if(userId !== null){
                    const result = await User.findOne({ _id: userId });
                    if(result){
                        req.user = userId;
                        next();
                    }else{
                        return res.status(401).json({ status: 'error', message: 'Invalid! Token' });
                    }
                }else{
                    return res.status(401).json({ status: 'error', message: 'Unauthorized Error!' });
                }
            }else{
                return res.status(401).json({ status: 'error', message: 'Unauthorized Error!' });
            }
        } else {
            return res.status(401).json({ status: 'error', message: 'Unauthorized Error!' });
        }
    } catch (error) {
        return res.status(401).json({ status: 'error', message: error.message + ' on '+ moment(error.expiredAt,).format('MMMM Do YYYY, h:mm:ss a') });
    }
}
module.exports = {
    apiAuth
}