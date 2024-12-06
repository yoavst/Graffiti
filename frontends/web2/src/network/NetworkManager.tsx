import { FC, useEffect } from 'react'
import { Node, elementType, compute, ExtraNodeProperties, ComputedProperty } from '../graph/types'
import { direction, Message, messageType } from './types'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { List } from 'immutable'
import { atom, useAtom } from 'jotai'
import { Operation, operationType } from '../graph/operations'
import { GraphState } from '../graph/state'
import { dataSetId } from '../utils/DateSet'

const messagesToSendAtom = atom(List<Message>())

export enum connectionStatus {
    closed,
    open,
    opening,
}

interface NetworkManagerProps {
    graphState: GraphState
    setGraphState: React.Dispatch<React.SetStateAction<GraphState>>
    webSocketAddress: string
    shouldConnect: boolean
    setConnectionStatus: (status: connectionStatus) => void
    direction: direction
    isNewNodeSelected: boolean
}

const NetworkManager: FC<NetworkManagerProps> = ({
    setGraphState,
    webSocketAddress,
    shouldConnect,
    setConnectionStatus,
    direction,
    isNewNodeSelected,
}) => {
    const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket<Message>(
        webSocketAddress,
        { shouldReconnect: () => false },
        shouldConnect
    )
    const [messagesToSend, setMessagesToSend] = useAtom(messagesToSendAtom)

    useEffect(() => {
        // Clear queue
        setMessagesToSend(List())
        // If open, send messages
        if (readyState === ReadyState.OPEN) {
            messagesToSend.forEach((msg) => {
                sendJsonMessage(msg, false)
            })
        }
    }, [messagesToSend, readyState, sendJsonMessage, setMessagesToSend])

    useEffect(() => {
        switch (lastJsonMessage.type) {
            case messageType.addNodeWithEdge: {
                setGraphState((graphState) => {
                    const [node, nodeOperations, newMaxId] = addNodeAsOperations(
                        graphState,
                        graphState.maxId,
                        lastJsonMessage.node,
                        lastJsonMessage.node.computedProperties
                    )

                    const [edgeOperations] = addEdgeAsOperations(state)

                    // TODO set current node
                    return graphState.apply(...operations)
                })

                break
            }
            case messageType.addNodesWithEdges:
            case messageType.updateNodes:
        }
    }, [lastJsonMessage])

    return <></>
}

function addNodeAsOperations(
    state: GraphState,
    maxId: dataSetId,
    extraProperties: ExtraNodeProperties,
    computedProperties: readonly ComputedProperty[]
): [node: Node, operations: Operation[], newMaxId: dataSetId] {
    const { graph } = state
    const address = extraProperties.address
    const matchingNode =
        address !== undefined
            ? graph.nodes.find((n) => n.extraProperties.address === address)
            : null

    if (matchingNode !== null) return [matchingNode, [], maxId]

    // Create new Node
    const node = compute({
        type: elementType.node,
        label: extraProperties.label?.toString() ?? '',
        color: undefined,
        computedProperties: computedProperties,
        extraProperties,
        id: maxId + 1,
    })
    return [
        node,
        [
            {
                type: operationType.addNode,
                node,
            },
        ],
        maxId + 1,
    ]
}

function addEdgeAsOperations(
    state: GraphState,
    maxId: dataSetId,
    node: Node,
    direction: direction
): [operations: Operation[], newMaxId: dataSetId] {
    const { graph, currentNode } = state

    if (currentNode === undefined) return [[], maxId]

    const [source, dest] = direction == 'n2e' ? [node, currentNode] : [currentNode, node]
    const currentEdge = graph.edges.find((e) => e.source.id === source.id && e.dest.id === dest.id)

    if (currentEdge !== null) return [[], maxId]
    return [
        [
            {
                type: operationType.addEdge,
                edge: {
                    type: elementType.edge,
                    id: maxId + 1,
                    source,
                    dest,
                },
            },
        ],
        maxId + 1,
    ]
}

export default NetworkManager
