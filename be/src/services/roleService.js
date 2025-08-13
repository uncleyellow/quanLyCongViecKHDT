import { roleModel } from '../models/roleModel'

const getList = async (data) => {
    try {
        const result = await roleModel.getList(data)
        return result
    } catch (error) { throw error }
}

const createNew = async (data) => {
    try {
        const newRole = await roleModel.createNew(data)
        return newRole
    } catch (error) { throw error }
}

const getDetail = async (data) => {
    try {
        const role = await roleModel.getDetail(data)
        return role
    } catch (error) { throw error }
}

const update = async (data, updateData) => {
    try {
        const updatedRole = await roleModel.update(data, updateData)
        return updatedRole
    } catch (error) { throw error }
}

const deleteItem = async (data) => {
    try {
        const deletedRole = await roleModel.delete(data)
        return deletedRole
    } catch (error) { throw error }
}

const getRolePermissions = async (roleId) => {
    try {
        const permissions = await roleModel.getRolePermissions(roleId)
        return permissions
    } catch (error) { throw error }
}

const assignPermissionsToRole = async (roleId, permissionIds) => {
    try {
        const result = await roleModel.assignPermissionsToRole(roleId, permissionIds)
        return result
    } catch (error) { throw error }
}

export const roleService = {
    getList,
    createNew,
    getDetail,
    update,
    deleteItem,
    getRolePermissions,
    assignPermissionsToRole
}
