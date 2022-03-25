import slugify from 'slugify'
import Product from '../models/productModel.js'
import Sub from '../models/subModel.js'

const getSubs = async (req, res) => {
	res.json(await Sub.find({}).sort({ createdAt: -1 }).exec())
}

const createSub = async (req, res) => {
	try {
		const { name, parent } = req.body
		const newSub = await new Sub({ name, parent, slug: slugify(name) }).save()
		res.json(newSub)
	} catch (err) {
		console.log('SUB CREATE ERR ----->', err)
		res.status(400).send('Create sub failed')
	}
}

const readSub = async (req, res) => {
	let sub = await Sub.findOne({ slug: req.params.slug }).exec()
	const products = await Product.find({ subs: sub }).populate('category').exec()
	res.json({
		sub,
		products,
	})
}

const updateSub = async (req, res) => {
	const { name, parent } = req.body
	try {
		const updated = await Sub.findOneAndUpdate(
			{ slug: req.params.slug },
			{ name, parent, slug: slugify(name) },
			{ new: true }
		)
		res.json(updated)
	} catch (err) {
		res.status(400).send('Sub update failed')
	}
}

const deleteSub = async (req, res) => {
	try {
		const deleted = await Sub.findOneAndDelete({ slug: req.params.slug })
		res.json(deleted)
	} catch (err) {
		res.status(400).send('Sub delete failed')
	}
}
export { getSubs, createSub, readSub, updateSub, deleteSub }
