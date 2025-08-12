import { StatusCodes } from 'http-status-codes'
import { departmentService } from '../services/departmentService'
import ApiError from '../utils/ApiError'

const getAllDepartments = async (req, res, next) => {
    try {
        const result = await departmentService.getList(req.query)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Departments retrieved successfully',
            pagination: result.pagination,
            data: result.data
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const createDepartment = async (req, res, next) => {
    try {
        const newDepartment = await departmentService.createNew(req.body)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Department created successfully',
            data: newDepartment
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const getDepartmentById = async (req, res, next) => {
    try {
        const department = await departmentService.getDetail(req.params)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Department retrieved successfully',
            data: department
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const updateDepartment = async (req, res, next) => {
    try {
        const updatedDepartment = await departmentService.update(req.params, req.body)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Department updated successfully',
            data: updatedDepartment
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const deleteDepartment = async (req, res, next) => {
    try {
        const deletedDepartment = await departmentService.deleteItem(req.params)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Department deleted successfully',
            data: deletedDepartment
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

export const departmentController = {
    getAllDepartments,
    createDepartment,
    getDepartmentById,
    updateDepartment,
    deleteDepartment
}
