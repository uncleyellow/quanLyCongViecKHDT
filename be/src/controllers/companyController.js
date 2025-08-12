import { StatusCodes } from 'http-status-codes'
import { companyService } from '../services/companyService'
import ApiError from '../utils/ApiError'

const getAllCompanies = async (req, res, next) => {
    try {
        const { userId } = req.user
        const result = await companyService.getList({ ...req.query, userId: userId })
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Companies retrieved successfully',
            pagination: result.pagination,
            data: result.data
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const createCompany = async (req, res, next) => {
    try {
        const { userId } = req.user
        const newCompany = await companyService.createNew({ ...req.body, userId: userId })
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Company created successfully',
            data: newCompany
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const getCompanyById = async (req, res, next) => {
    try {
        const { userId } = req.user
        const company = await companyService.getDetail({ ...req.params, userId: userId })
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Company retrieved successfully',
            data: company
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const updateCompany = async (req, res, next) => {
    try {
        const { userId } = req.user
        const updatedCompany = await companyService.update({ ...req.params, userId: userId }, req.body)
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Company updated successfully',
            data: updatedCompany
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

const deleteCompany = async (req, res, next) => {
    try {
        const { userId } = req.user
        const deletedCompany = await companyService.deleteItem({ ...req.params, userId: userId })
        const responseObject = {
            code: StatusCodes.OK,
            status: 'success',
            message: 'Company deleted successfully',
            data: deletedCompany
        }
        res.status(StatusCodes.OK).json(responseObject)
    } catch (error) { next(error) }
}

export const companyController = {
    getAllCompanies,
    createCompany,
    getCompanyById,
    updateCompany,
    deleteCompany
}
