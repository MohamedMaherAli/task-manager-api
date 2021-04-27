const express = require('express');
const router = new express.Router();
require('../db/mongoose');
const User = require('../models/user');
const auth = require('../Middlewares/auth');
const multer = require('multer');
const sharp = require('sharp');
const upload = multer({
	limits: {
		fileSize: 1000000
	},
	fileFilter(req, file, cb) {
		if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
			return cb(new Error('Only images with (jpg, jpeg, png) extensions are accepted'));
		}
		cb(undefined, true);
	}
});

router.post('/users/login', async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findByCredentials(email, password);
		const token = await user.generateAuthtoken();
		res.send({ user, token });
	} catch (e) {
		res.status(400).send(e);
	}
});

router.post('/users/logout', auth, async (req, res) => {
	try {
		const user = req.user;
		const currentToken = req.token;
		user.tokens = user.tokens.filter((token) => {
			return token.token !== currentToken;
		});
		await user.save();
		res.send();
	} catch (e) {
		res.status(500).send();
	}
});

router.post('/users/logoutAll', auth, async (req, res) => {
	try {
		const user = req.user;
		user.tokens = [];
		await user.save();
		res.send();
	} catch (e) {
		res.status(500).send();
	}
});

router.get('/users/me', auth, async (req, res) => {
	const user = req.user;
	res.send(user);
});

router.post(
	'/users/me/avatar',
	auth,
	upload.single('avatar'),
	async (req, res) => {
		const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).ping().toBuffer();
		req.user.avatar = buffer;
		await req.user.save();
		res.send();
	},
	(error, req, res, next) => {
		res.status(400).send({ error: error.message });
	}
);

router.post('/users', async (req, res) => {
	const user = new User(req.body);
	try {
		await user.save();
		const token = await user.generateAuthtoken();
		res.status(201).send({ user, token });
	} catch (e) {
		res.status(400).send(e);
	}
});

router.patch('/users/me', auth, async (req, res) => {
	const validUpdates = [ 'name', 'password', 'email', 'age' ];
	const requestUpdates = Object.keys(req.body);
	const isValidUpdate = requestUpdates.every((update) => {
		return validUpdates.includes(update);
	});
	if (!isValidUpdate) {
		return res.status(400).send({ error: 'Invalid Update' });
	}
	try {
		const user = req.user;
		requestUpdates.forEach((update) => (user[update] = req.body[update]));
		await user.save();
		res.send(user);
	} catch (e) {
		res.status(400).send(e);
	}
});

router.delete('/users/me', auth, async (req, res) => {
	try {
		const user = req.user;
		await user.remove();
		res.send(user);
	} catch (e) {
		res.status(500).send(e);
	}
});

router.delete('/users/me/avatar', auth, async (req, res) => {
	try {
		req.user.avatar = undefined;
		await req.user.save();
		res.send();
	} catch (e) {
		res.status(500).send();
	}
});

router.get('/users/:id/avatar', async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		if (!user || !user.avatar) {
			throw new Error();
		}
		res.set('Content-Type', 'image/png');
		res.send(user.avatar);
	} catch (e) {
		res.status(404).send();
	}
});

module.exports = router;
