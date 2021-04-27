const sgMail = require('@sendgrid/mail');
const sendgridApiKey = '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';

sgMail.setApiKey(sendgridApiKey);

const sendWelcomeMessage = (email, name) => {
	sgMail.send({
		to: email,
		from: 'g3.nius@yahoo.com',
		subject: 'dummy text',
		text: `hello ${name} hope you enjoy the app`
	});
};

module.exports = {
	sendWelcomeMessage
};
