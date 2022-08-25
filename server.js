require('dotenv').config();
const app = require('./src/app');

app.listen(process.env.PORT || 5000, function () {
	console.log(
		'Express server listening on port %d in %s mode',
		this.address().port,
		app.settings.env
	);
});
