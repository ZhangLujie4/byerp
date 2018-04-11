//权限检验lastDb，loggedIn
module.exports = function(req, res, next){
    "use strict";
    var err;
  
    if (req.session.isMobile) {
        req.session.lastDb = 'CRM';
        return next();
    }
    if (req.session && req.session.loggedIn && req.session.lastDb) {
        return next();
    }

    err = new Error();
    err.status = 404; //404 for more security

    next(err);
};
