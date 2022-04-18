function escapeApostrophe(value) {
    if (!value) {
        return
    }
    let valueCopy = ''
    if (typeof value === 'string') {
        valueCopy = value.replace(/'/g, "\\'")
    } else if (value instanceof Array) {

        valueCopy = value.join('£').replace(/'/g, "\\'").split('£')
    }
    return valueCopy
}

module.exports = {
    escapeApostrophe
}