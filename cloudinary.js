import cloudinary from 'cloudinary'

//call from product controller, backend
const uploads = (file) => {
	cloudinary.config({
		cloud_name: process.env.CLOUD_NAME,
		api_key: process.env.CLOUDINARY_API_KEY,
		api_secret: process.env.CLOUDINARY_API_SECRET,
	})

	return new Promise((resolve, reject) => {
		cloudinary.v2.uploader.upload(
			file,
			{
				resource_type: 'auto',
				upload_preset: 'shop_products', // name folder that configured on cloudinary
			},
			(err, res) => {
				if (err) {
					reject(err)
				} else {
					return resolve({
						url: res.url,
						id: res.public_id,
					})
				}
			}
		)
	})
}

// direct call from client
const removes = (req, res) => {
	cloudinary.config({
		cloud_name: process.env.CLOUD_NAME,
		api_key: process.env.CLOUDINARY_API_KEY,
		api_secret: process.env.CLOUDINARY_API_SECRET,
	})
	let image_id = req.body.public_id
	cloudinary.uploader.destroy(image_id, (err, result) => {
		if (err) return res.json({ message: 'failed', err })
		res.send('ok')
	})
}

export { uploads, removes }
