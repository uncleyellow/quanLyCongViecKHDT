import { StatusCodes } from 'http-status-codes'
import { roleService } from '../services/roleService'

const getList = async (req, res, next) => {
    try {
        const result = await roleService.getList(req.query)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Roles retrieved successfully',
            pagination: result.pagination,
            data: result.data
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const createNew = async (req, res, next) => {
    try {
        const newRole = await roleService.createNew(req.body)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Role created successfully',
            data: newRole
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const getDetail = async (req, res, next) => {
    try {
        const role = await roleService.getDetail(req.params)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Role retrieved successfully',
            data: role
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const update = async (req, res, next) => {
    try {
        const updatedRole = await roleService.update(req.params, req.body)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Role updated successfully',
            data: updatedRole
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const deleteItem = async (req, res, next) => {
    try {
        const deletedRole = await roleService.deleteItem(req.params)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Role deleted successfully',
            data: deletedRole
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const getRolePermissions = async (req, res, next) => {
    try {
        const permissions = await roleService.getRolePermissions(req.params.id)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Role permissions retrieved successfully',
            data: permissions
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const assignPermissionsToRole = async (req, res, next) => {
    try {
        const { permissionIds } = req.body
        const result = await roleService.assignPermissionsToRole(req.params.id, permissionIds)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: result.message,
            data: result
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

export const roleController = {
    getList,
    createNew,
    getDetail,
    update,
    deleteItem,
    getRolePermissions,
    assignPermissionsToRole
}
