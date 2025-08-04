export const slugify = (val) => {
    if (!val) return ''
    return String(val)
        .normalize('NFKD') // split accented characters into their base characters and diacritical marks
        .replace(/[\u0300-\u036f]/g, '') // remove all the accents, which happen to be all in the \u03xx UNICODE block.
        .trim() // trim leading or trailing whitespace
        .toLowerCase() // convert to lowercase
        .replace(/[^a-z0-9 -]/g, '') // remove non-alphanumeric characters
        .replace(/\s+/g, '-') // replace spaces with hyphens
        .replace(/-+/g, '-') // remove consecutive hyphens
}

export const formatDateTimeForMySQL = (dateTimeString) => {
    if (!dateTimeString) return null

    try {
        const date = new Date(dateTimeString)
        if (isNaN(date.getTime())) return null

        // Get local time components to avoid timezone offset issues
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')

        // Format as YYYY-MM-DD HH:mm:ss for MySQL (local time)
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    } catch (error) {
        console.error('Error formatting datetime:', error)
        return null
    }
}