const qs = require('querystring')
const frenchkiss = require('frenchkiss')
const compiler = require('vue-template-compiler')


module.exports = function (source) {
    const query = qs.parse(this.resourceQuery.slice(1))

    if (query.type === 'template' && query.jeanrry != null) {
        frenchkiss.locale(query.jeanrry)
        const sfc = compiler.parseComponent(source)
        const langSettings = JSON.parse(sfc.customBlocks.find(({type}) => type === 'jeanrry').content)
        for (key of Object.keys(langSettings)) {
            frenchkiss.set(key, langSettings[key])
        }

        let current = sfc.template.start
        let end = sfc.template.end
        let result = source.substring(0, current)
        while (current < end) {
            const stack = ['(']
            const functionStart = source.indexOf('t(', current + 1) + 2 // skip the t and '('
            if (functionStart === 1) break
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
                result = result + source.substring(current, functionStart - 2) + frenchkiss.t(...params)
                current = pointer
            } else {
                result = result + source.substring(current, functionStart)
                current = functionStart
            }
        }
        result = result + source.substring(current)
        this.callback(null, result)
    } 
    else if (query.type === 'custom' && query.blockType === 'jeanrry') { // skip to avoid 'You may need an additional loader to handle the result of these loaders.'
        const sfc = compiler.parseComponent(source)
        const block = sfc.customBlocks.find(({type}) => type === 'jeanrry')
        this.callback(null, source.substring(0, block.start) + source.substring(block.end)) 
    }
    else {
        this.callback(null, source)
    }
}

