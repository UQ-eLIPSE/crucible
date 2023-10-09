const bcrypt = require("bcryptjs");

const cmp = (pass, hash) => {
	bcrypt.compare(pass, hash, (err, result) => {
		console.log( (result ? "SUCCESS: " : "ERROR!: ") + `${pass} <=> ${hash}` );
	});
}

const hsh = pass => {
	bcrypt.hash(pass, 10, (err, hash) => {
		console.log(`${hash} <= ${pass}`);
		cmp(pass,hash);
	});
}

cmp("aPP135banana5p3ar5","$2a$10$Unw/qKPdvxt9Sxbf2MymiuNZCP2PsUPWq7xbzvnkp5IRYUltJ4x3a");
cmp("admin", "$2a$10$nyxF2WdKebhM9CjCqEnTS.TBKqAxvCiAgdufr.uznq8ThMwc1n8Ie");

hsh("uqpwalle");


//bcrypt.genSalt(saltRounds, function(err, salt) {
//	bcrypt.hash(password, salt, function(err, hash) {
//		console.log(hash);
//	});
//});

//bcrypt.hash(password, saltRounds, function(err, hash) {
//	console.log(`${password} => ${hash}`);
//	bcrypt.compare(password, hash, function(err, result) {
//		if (result) console.log('SUCCESS');
//		else console.log('ERROR!');
//	});
//});

