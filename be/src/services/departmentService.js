import { departmentModel } from '../models/departmentModel'

const getList = async (data) => {
    try {
        const result = await departmentModel.getList(data)
        return result
    } catch (error) { throw error }
}

const createNew = async (data) => {
    try {
        const newDepartment = await departmentModel.createNew(data)
        return newDepartment
    } catch (error) { throw error }
}

const getDetail = async (data) => {
    try {
        const department = await departmentModel.getDetail(data)
        return department
    } catch (error) { throw error }
}

const update = async (data, updateData) => {
    try {
        const updatedDepartment = await departmentModel.update(data, updateData)
        return updatedDepartment
    } catch (error) { throw error }
}

const deleteItem = async (data) => {
    try {
        const deletedDepartment = await departmentModel.delete(data)
        return deletedDepartment
    } catch (error) { throw error }
}

export const departmentService = {
    getList,
    createNew,
    getDetail,
    update,
    deleteItem
}
