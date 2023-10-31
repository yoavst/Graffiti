class DataSet {
    constructor(elements, id_func = (element => element.id), id_set_func = ((element, new_id) => { element.id = new_id })) {
        this.elements = [...elements]
        this.id_func = id_func
        this.id_set_func = id_set_func

        this.elements.sort((a, b) => id_func(a) - id_func(b))
    }

    get(id) {
        const index = binarySearch(this.elements, id, this.id_func)
        if (index < 0) {
            return null
        }

        return this.elements[index]
    }

    add(element) {
        const elementId = this.id_func(element)
        const insertionIndex = binarySearch(this.elements, elementId, this.id_func)
        if (insertionIndex >= 0) {
            throw new Error(`Element with the given id is already in the array. Inserted element: ${element}`);
        }

        this.elements.splice(~insertionIndex, 0, element)
    }

    remove(id) {
        const deletionIndex = binarySearch(this.elements, id, this.id_func)
        if (deletionIndex < 0) {
            throw new Error(`Element with the given id is not in the array. id: ${id}`);
        }

        this.elements.splice(deletionIndex, 1)
    }

    updateOnly(updates) {
        for (const update of updates) {
            const updateId = this.id_func(update)
            const updateIndex = binarySearch(this.elements, updateId, this.id_func)
            if (updateIndex < 0) {
                throw new Error(`Update for element with invalid id: ${update}`)
            }
            const originalElement = this.elements[updateIndex]
            this.elements[updateIndex] = { ...originalElement, ...update }
        }
    }

    clear() {
        this.elements = []
    }

    swap(id1, id2) {
        const firstIndex = binarySearch(this.elements, id1, this.id_func)
        const secondIndex = binarySearch(this.elements, id2, this.id_func)

        if (firstIndex < 0 || secondIndex < 0) {
            throw new Error(`Failed to swap, as one of those ids are not in the dataset: ${id1}, ${id2}`)
        }

        const firstElement = this.elements[firstIndex]
        const secondElement = this.elements[secondIndex]

        this.id_set_func(firstElement, id2)
        this.id_set_func(secondElement, id1)

        this.elements[firstIndex] = secondElement
        this.elements[secondIndex] = firstElement
    }

    asReadOnly() {
        return this.elements
    }

    map(mapping) {
        return this.elements.map(mapping)
    }

    filter(filter) {
        return this.elements.filter(filter)
    }
}


function binarySearch(arr, id, id_func) {
    let m = 0;
    let n = arr.length - 1;
    while (m <= n) {
        let k = (n + m) >> 1;
        let cmp = id - id_func(arr[k]);
        if (cmp > 0) {
            m = k + 1;
        } else if (cmp < 0) {
            n = k - 1;
        } else {
            return k;
        }
    }
    return ~m;
}
