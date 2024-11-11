import { FC, useEffect } from 'react'
import { Graph } from '../graph/types'
import { direction, Message, messageType } from './types'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { List } from 'immutable'
import { atom, useAtom } from 'jotai'

const messagesToSendAtom = atom(List<Message>())

export enum connectionStatus {
    closed,
    open,
    opening,
}

interface NetworkManagerProps {
    graph: Graph
    setGraph: (graph: Graph) => void
    webSocketAddress: string
    shouldConnect: boolean
    setConnectionStatus: (status: connectionStatus) => void
    direction: direction
}

const NetworkManager: FC<NetworkManagerProps> = ({
    graph,
    setGraph,
    webSocketAddress,
    shouldConnect,
    setConnectionStatus,
    direction,
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
            case messageType.addNodeWithEdge:
                graph.nodes.any
            case messageType.addNodesWithEdges:
            case messageType.updateNodes:
        }
    }, [lastJsonMessage])

    return <></>
}

export default NetworkManager
