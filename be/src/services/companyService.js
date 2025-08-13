import { companyModel } from '../models/companyModel'

const getList = async (data) => {
    try {
        const result = await companyModel.getList(data)
        return result
    } catch (error) { throw error }
}

const createNew = async (data) => {
    try {
        const newCompany = await companyModel.createNew(data)
        return newCompany
    } catch (error) { throw error }
}

const getDetail = async (data) => {
    try {
        const company = await companyModel.getDetail(data)
        return company
    } catch (error) { throw error }
}

const update = async (data, updateData) => {
    try {
        const updatedCompany = await companyModel.update(data, updateData)
        return updatedCompany
    } catch (error) { throw error }
}

const deleteItem = async (data) => {
    try {
        const deletedCompany = await companyModel.delete(data)
        return deletedCompany
    } catch (error) { throw error }
}

export const companyService = {
    getList,
    createNew,
    getDetail,
    update,
    deleteItem
}
