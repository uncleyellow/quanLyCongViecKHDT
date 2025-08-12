import { permissionModel } from '../models/permissionModel'

const getList = async (data) => {
    try {
        const result = await permissionModel.getList(data)
        return result
    } catch (error) { throw error }
}

const createNew = async (data) => {
    try {
        const newPermission = await permissionModel.createNew(data)
        return newPermission
    } catch (error) { throw error }
}

const getDetail = async (data) => {
    try {
        const permission = await permissionModel.getDetail(data)
        return permission
    } catch (error) { throw error }
}

const update = async (data, updateData) => {
    try {
        const updatedPermission = await permissionModel.update(data, updateData)
        return updatedPermission
    } catch (error) { throw error }
}

const deleteItem = async (data) => {
    try {
        const deletedPermission = await permissionModel.delete(data)
        return deletedPermission
    } catch (error) { throw error }
}

export const permissionService = {
    getList,
    createNew,
    getDetail,
    update,
    deleteItem
}
