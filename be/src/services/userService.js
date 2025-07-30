/* eslint-disable no-useless-catch */
import { StatusCodes } from 'http-status-codes'
import { cloneDeep } from 'lodash'
import { userModel } from '../models/userModel'
import ApiError from '../utils/ApiError'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

const getMe = async (id) => { 
  const user = await userModel.findOneById(id)
  delete user.password_hash
  return user
}

export const userService = {
  getMe
}