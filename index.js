const qs = require('querystring')
const compiler = require('vue-template-compiler')
const utils = require('loader-utils')

const defaultOption = {
    translator: 'frenchkiss',
    queryName: 'jeanrry',
    blockName: 'jeanrry',
    locale: 'en',
    fallback: 'en',
    functionName: 't',
    remove: true
}



module.exports = function (source) {
    const query = qs.parse(this.resourceQuery.slice(1))

    const mergedOption = { ...defaultOption, ...utils.getOptions(this) }
    const queryName = mergedOption.queryName
    const blockName = mergedOption.blockName

    const frenchkiss = require(mergedOption.translator)

    if (query.type === 'template' && query[queryName] != null && query[queryName] !== 'false') {
        query[queryName] === 'true' ? frenchkiss.locale(mergedOption.locale) : frenchkiss.locale(query[queryName])
        frenchkiss.fallback(mergedOption.fallback)

        const functionName = mergedOption.functionName
        const functionNameLength = functionName.length
        const sfc = compiler.parseComponent(source)
        const langSettings = JSON.parse(sfc.customBlocks.find(({ type }) => type === blockName).content)
        for (key of Object.keys(langSettings)) {
            frenchkiss.set(key, langSettings[key])
        }

        let current = sfc.template.start
        let end = sfc.template.end
        let result = source.substring(0, current)
        while (current < end) {
            const stack = ['('] // the start of the function
            const functionStart = source.indexOf(functionName + '(', current + 1) + functionNameLength + 1 // skip the function name and '(', the start of the first param
            if (functionStart - functionNameLength - 1 === -1) break // if there's no more translation function, break
            let pointer = functionStart
            let stringType = ''
            while (stack.length > 0 && pointer < end) {
                const char = source.charAt(pointer)
                // TODO: handling escape?
                switch (char) {
                    // string handling
                    case "'": {
                        if (stringType === '') stringType = "'" // starting string
                        else if (stringType === "'") { // ending string
                            stringType = ''
                        }
                        break
                    }
                    case '"': {
                        if (stringType === '') stringType = '"' // starting string
                        else if (stringType === '"') { // ending string
                            stringType = ''
                        }
                        break
                    }
                    case '`': {
                        if (stringType === '') stringType = '`' // starting string
                        else if (stringType === '`') { // ending string
                            stringType = ''
                        }
                        break
                    }
                    // brackets handling
                    case '[':
                    case '{':
                    case '(': {
                        if (stringType === '') {
                            stack.push(char)
                        }
                        // skip if in string
                        break;
                    }
                    case ']': {
                        if (stringType === '') {
                            if (stack.length > 0 && stack[stack.length - 1] === '[') {
                                stack.pop()
                            } else {
                                pointer = end // break from the while loop
                            }
                        }
                        break
                    }
                    case '}': {
                        if (stringType === '') {
                            if (stack.length > 0 && stack[stack.length - 1] === '{') {
                                stack.pop()
                            } else {
                                pointer = end // break from the while loop
                            }
                        }
                        break
                    }
                    case ')': {
                        if (stringType === '') {
                            if (stack.length > 0 && stack[stack.length - 1] === '(') {
                                stack.pop()
                            } else {
                                pointer = end // break from the while loop
                            }
                        }
                        break
                    }
                }
                pointer++
            }
            if (stack.length === 0 && pointer < end + 1) {
                const params = new Function('"use strict";return [' + source.substring(functionStart, pointer - 1) + ']')() // remove the trailing bracket
                result = result + source.substring(current, functionStart - functionNameLength - 1) + frenchkiss.t(...params)
                current = pointer
            } else {
                result = result + source.substring(current, functionStart)
                current = functionStart
            }
        }
        result = result + source.substring(current)
        this.callback(null, result)
    }
    else if (mergedOption.remove && query.type === 'custom' && query.blockType === blockName) { // skip to avoid 'You may need an additional loader to handle the result of these loaders.'
        const sfc = compiler.parseComponent(source)
        const block = sfc.customBlocks.find(({ type }) => type === blockName)
        this.callback(null, source.substring(0, block.start) + source.substring(block.end))
    }
    else {
        this.callback(null, source)
    }
}

