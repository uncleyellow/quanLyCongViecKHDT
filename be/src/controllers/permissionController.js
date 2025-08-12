import { StatusCodes } from 'http-status-codes'
import { permissionService } from '../services/permissionService'

const getList = async (req, res, next) => {
    try {
        const result = await permissionService.getList(req.query)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Permissions retrieved successfully',
            pagination: result.pagination,
            data: result.data
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const createNew = async (req, res, next) => {
    try {
        const newPermission = await permissionService.createNew(req.body)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Permission created successfully',
            data: newPermission
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const getDetail = async (req, res, next) => {
    try {
        const permission = await permissionService.getDetail(req.params)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Permission retrieved successfully',
            data: permission
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const update = async (req, res, next) => {
    try {
        const updatedPermission = await permissionService.update(req.params, req.body)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Permission updated successfully',
            data: updatedPermission
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const deleteItem = async (req, res, next) => {
    try {
        const deletedPermission = await permissionService.deleteItem(req.params)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Permission deleted successfully',
            data: deletedPermission
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

export const permissionController = {
    getList,
    createNew,
    getDetail,
    update,
    deleteItem
}
