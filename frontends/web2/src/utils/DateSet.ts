import { List, Seq } from 'immutable'

export type dataSetId = number

export default class DataSet<T> {
    private elements: List<T>
    private elementToId: (element: T) => dataSetId

    private constructor(elements: List<T>, elementToId: (element: T) => dataSetId) {
        this.elements = elements
        this.elementToId = elementToId
    }

    public get(id: dataSetId | undefined): T | undefined {
        if (id === undefined) return undefined

        const index = binarySearch(this.elements, id, this.elementToId)

        if (index < 0) {
            return undefined
        }
        return this.elements.get(index)
    }

    public insert(element: T): DataSet<T> {
        const elementId = this.elementToId(element)
        const insertionIndex = binarySearch(this.elements, elementId, this.elementToId)

        if (insertionIndex >= 0) {
            throw new Error(
                `Element with the given id is already in the array. Inserted element: ${element}`
            )
        }

        const newElements = this.elements.insert(insertionIndex, element)
        return DataSet.fromSortedList(newElements, this.elementToId)
    }

    public remove(id: dataSetId): DataSet<T> {
        const removalIndex = binarySearch(this.elements, id, this.elementToId)

        if (removalIndex < 0) {
            throw new Error(`Element with the given id is not in the array. id: ${id}`)
        }

        const newElements = this.elements.remove(removalIndex)
        return DataSet.fromSortedList(newElements, this.elementToId)
    }

    public removeAll(ids: readonly dataSetId[]): DataSet<T> {
        if (ids.length === 0) return this

        const newElements = this.elements.toArray()
        for (const id of ids) {
            const removalIndex = binarySearch(this.elements, id, this.elementToId)

            if (removalIndex < 0) {
                throw new Error(`Element with the given id is not in the array. id: ${id}`)
            }

            newElements.splice(removalIndex, 1)
        }

        return DataSet.fromSortedArray(newElements, this.elementToId)
    }

    /**
     * Update one or multiple existing items. This is the same as update except that it throws if the updated item doesn't exists.
     *  This prevents partial items from slipping through type checking.
     */
    public updateOnly(updates: readonly T[]): DataSet<T> {
        const newElements = this.elements.withMutations((mutableElements) => {
            for (const update of updates) {
                // Find index of the updated element
                const updatedId = this.elementToId(update)
                const updateIndex = binarySearch(this.elements, updatedId, this.elementToId)
                if (updateIndex < 0) {
                    throw new Error(`Update for element with invalid id: ${update}`)
                }

                // Perform update
                mutableElements = mutableElements.update(updateIndex, (originalElement) => ({
                    ...originalElement,
                    ...update,
                }))
            }
        })

        return DataSet.fromSortedList(newElements, this.elementToId)
    }

    /**
     * Swap two elements ids efficently
     */
    public swapElements(
        id1: dataSetId,
        id2: dataSetId,
        setIdToElement: (element: T, id: dataSetId) => void
    ): DataSet<T> {
        const firstIndex = binarySearch(this.elements, id1, this.elementToId)
        const secondIndex = binarySearch(this.elements, id2, this.elementToId)

        if (firstIndex < 0 || secondIndex < 0) {
            throw new Error(
                `Failed to swap, as one of those ids are not in the dataset: ${id1}, ${id2}`
            )
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const firstElement = { ...this.elements.get(firstIndex)! }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const secondElement = { ...this.elements.get(secondIndex)! }
        setIdToElement(firstElement, id2)
        setIdToElement(secondElement, id1)

        const newElements = this.elements.withMutations((mutableElements) => {
            mutableElements
                .update(firstIndex, () => secondElement)
                .update(secondIndex, () => firstElement)
        })

        return DataSet.fromSortedList(newElements, this.elementToId)
    }

    public clear(): DataSet<T> {
        return DataSet.fromSortedList(List(), this.elementToId)
    }

    public map<V>(mapping: (element: T) => V): Seq.Indexed<V> {
        return this.elements.toSeq().map(mapping)
    }

    public filter(filter: (element: T) => boolean): Seq.Indexed<T> {
        return this.elements.toSeq().filter(filter)
    }

    public find(filter: (element: T) => boolean): T | null {
        return this.elements.find(filter) ?? null
    }

    public forEach(func: (element: T) => void): void {
        this.elements.forEach(func)
    }

    public get size(): number {
        return this.elements.size
    }

    public get maxId(): dataSetId {
        const lastElement = this.elements.last()
        return lastElement !== undefined ? this.elementToId(lastElement) : 0
    }

    public toJSON(): T[] {
        return this.elements.toJSON()
    }

    public static fromArray<T>(
        elements: readonly T[],
        elementToId: (e: T) => dataSetId
    ): DataSet<T> {
        const sortedElements = [...elements].sort((a, b) => elementToId(a) - elementToId(b))
        return DataSet.fromSortedArray(sortedElements, elementToId)
    }

    public static fromList<T>(list: List<T>, elementToId: (e: T) => dataSetId): DataSet<T> {
        const sortedList = list.sortBy(elementToId)
        return new DataSet<T>(sortedList, elementToId)
    }

    public static fromSortedArray<T>(
        sortedElements: readonly T[],
        elementToId: (e: T) => dataSetId
    ): DataSet<T> {
        return DataSet.fromSortedList(List(sortedElements), elementToId)
    }

    public static fromSortedList<T>(
        sortedList: List<T>,
        elementToId: (e: T) => dataSetId
    ): DataSet<T> {
        return new DataSet<T>(sortedList, elementToId)
    }
}

function binarySearch<T>(arr: List<T>, id: dataSetId, elementToId: (element: T) => dataSetId) {
    let m = 0
    let n = arr.size - 1
    while (m <= n) {
        const k = (n + m) >> 1
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const cmp = id - elementToId(arr.get(k)!)
        if (cmp > 0) {
            m = k + 1
        } else if (cmp < 0) {
            n = k - 1
        } else {
            return k
        }
    }
    return ~m
}
