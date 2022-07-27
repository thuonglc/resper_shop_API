// Filter, sorting and paginating
class APIFeatures {
	constructor(query, queryString) {
		this.query = query
		this.queryString = queryString
	}

	filtering() {
		const queryObj = { ...this.queryString }
		const excludedFields = ['page', 'sort', 'limit']
		excludedFields.forEach((el) => delete queryObj[el])
		let queryStr = JSON.stringify(queryObj)
		queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in|regex)\b/g, (match) => '$' + match)

		//    gte = greater than or equal
		//    lte = less than or equal
		//    lt = lesser than
		//    gt = greater than
		this.query.find(JSON.parse(queryStr))
		return this
	}

	sorting() {
		if (this.queryString.sort) {
			const sortBy = this.queryString.sort.split(',').join(' ')
			this.query = this.query.sort(sortBy)
		} else {
			this.query = this.query.sort('-createdAt')
		}
		return this
	}

	paginating() {
		const page = this.queryString.page * 1 || 0
		const limit = this.queryString.limit * 1 || 15
		const skip = page * limit
		this.query = this.query.skip(skip).limit(limit)
		return this
	}
}

export { APIFeatures }
