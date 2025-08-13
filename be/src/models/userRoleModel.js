import db from '../config/db'

// Get user roles
const getUserRoles = async (userId) => {
    try {
        const query = `
            SELECT r.* 
            FROM roles r
            INNER JOIN user_roles ur ON r.id = ur.roleId
            WHERE ur.userId = ?
        `
        const result = await db.query(query, [userId])
        return result[0]
    } catch (error) { throw new Error(error) }
}

// Get user permissions (from roles + direct permissions)
const getUserPermissions = async (userId) => {
    try {
        const query = `
            SELECT DISTINCT p.* 
            FROM permissions p
            WHERE p.id IN (
                -- Permissions from roles
                SELECT rp.permissionId 
                FROM role_permissions rp
                INNER JOIN user_roles ur ON rp.roleId = ur.roleId
                WHERE ur.userId = ?
                UNION
                -- Direct permissions
                SELECT up.permissionId 
                FROM user_permissions up
                WHERE up.userId = ?
            )
        `
        const result = await db.query(query, [userId, userId])
        return result[0]
    } catch (error) { throw new Error(error) }
}

// Check if user has specific permission
const hasPermission = async (userId, permissionName) => {
    try {
        const query = `
            SELECT COUNT(*) as count
            FROM permissions p
            WHERE p.name = ? AND p.id IN (
                -- Permissions from roles
                SELECT rp.permissionId 
                FROM role_permissions rp
                INNER JOIN user_roles ur ON rp.roleId = ur.roleId
                WHERE ur.userId = ?
                UNION
                -- Direct permissions
                SELECT up.permissionId 
                FROM user_permissions up
                WHERE up.userId = ?
            )
        `
        const result = await db.query(query, [permissionName, userId, userId])
        return result[0][0].count > 0
    } catch (error) { throw new Error(error) }
}

// Assign roles to user
const assignRolesToUser = async (userId, roleIds) => {
    try {
        // First, remove existing roles
        await db.query('DELETE FROM user_roles WHERE userId = ?', [userId])
        
        // Then, insert new roles
        if (roleIds && roleIds.length > 0) {
            const values = roleIds.map(roleId => `('${userId}', '${roleId}')`).join(', ')
            const query = `INSERT INTO user_roles (userId, roleId) VALUES ${values}`
            await db.query(query)
        }
        
        return { message: 'Roles assigned successfully' }
    } catch (error) { throw new Error(error) }
}

// Assign permissions to user (direct permissions)
const assignPermissionsToUser = async (userId, permissionIds) => {
    try {
        // First, remove existing direct permissions
        await db.query('DELETE FROM user_permissions WHERE userId = ?', [userId])
        
        // Then, insert new permissions
        if (permissionIds && permissionIds.length > 0) {
            const values = permissionIds.map(permissionId => `('${userId}', '${permissionId}')`).join(', ')
            const query = `INSERT INTO user_permissions (userId, permissionId) VALUES ${values}`
            await db.query(query)
        }
        
        return { message: 'Permissions assigned successfully' }
    } catch (error) { throw new Error(error) }
}

// Get user with roles and permissions
const getUserWithRolesAndPermissions = async (userId) => {
    try {
        // Get user info
        const userQuery = `SELECT * FROM users WHERE id = ? AND deletedAt IS NULL`
        const userResult = await db.query(userQuery, [userId])
        const user = userResult[0][0]
        
        if (!user) {
            return null
        }
        
        // Get user roles
        const roles = await getUserRoles(userId)
        
        // Get user permissions
        const permissions = await getUserPermissions(userId)
        
        // Remove sensitive data
        const { passwordHash, ...sanitizedUser } = user
        
        return {
            ...sanitizedUser,
            roles,
            permissions
        }
    } catch (error) { throw new Error(error) }
}

export const userRoleModel = {
    getUserRoles,
    getUserPermissions,
    hasPermission,
    assignRolesToUser,
    assignPermissionsToUser,
    getUserWithRolesAndPermissions
}
