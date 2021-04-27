const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true
		},
		age: {
			type: Number,
			default: 0
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
			validate(value) {
				if (!validator.isEmail(value)) {
					throw new Error('Email is invalid');
				}
			}
		},
		password: {
			type: String,
			required: true,
			trim: true,
			validate(value) {
				if (value.length < 6) {
					throw new Error('Password must be greater than 6 characters');
				} else if (value.toLowerCase().includes('password')) {
					throw new Error('Password shouldnt contain "password" keyword');
				}
			}
		},
		tokens: [
			{
				token: {
					type: String,
					required: true
				}
			}
		],
		avatar: {
			type: Buffer
		}
	},
	{
		timestamps: true
	}
);

//toJSON used to apply the options to every document of your schema by default
userSchema.methods.toJSON = function() {
	const user = this;
	//converts mongoose document into javascript object
	const userObject = user.toObject();

	delete userObject.tokens;
	delete userObject.password;
	delete userObject.avatar;

	return userObject;
};

userSchema.methods.generateAuthtoken = async function() {
	const user = this;
	const token = await jwt.sign({ _id: user._id.toString() }, process.env.SECRET_KEY);
	user.tokens = user.tokens.concat({ token });
	await user.save();
	return token;
};

userSchema.statics.findByCredentials = async (email, password) => {
	const user = await User.findOne({ email });

	if (!user) {
		throw new Error('Unable to login');
	}

	const isMatch = await bcrypt.compare(password, user.password);

	if (!isMatch) {
		throw new Error('unable to login');
	}

	return user;
};

//setting up a virtual property..its a relationship between 2 intities
userSchema.virtual('tasks', {
	ref: 'Task',
	localField: '_id',
	foreignField: 'owner'
});

//Hash the password before saving
userSchema.pre('save', async function(next) {
	const user = this;

	//returns true if the user is newly created or the password is updated
	if (user.isModified('password')) {
		user.password = await bcrypt.hash(user.password, 8);
	}
	next();
});

//delete the tasks before deleting the user
userSchema.pre('remove', async function(next) {
	const user = this;
	await Task.deleteMany({ owner: user._id });
	next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
