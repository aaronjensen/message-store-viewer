import * as React from "react"
import { useRouter } from "next/router"
import useSWR from "swr"
import "twin.macro"
import Xarrow from "@components/xarrow"
import { usePopper } from "react-popper"
import { css } from "twin.macro"

const fetchJSON = (url: string) => fetch(url).then((res) => res.json())

type Value = string | number | null
type MessageData = Record<string, Value>

interface Message {
  id: string
  type: string
  data: MessageData
  position: number
  global_position: number
  stream_name: string
  metadata?: Record<string, string | number | null>
}

const Stream = ({ streamName }: { streamName: string }) => {
  const { data } = useSWR<Message[]>(`/api/stream/${streamName}`, fetchJSON, {
    refreshInterval: 500,
  })

  return (
    <div
      tw="grid grid-flow-col auto-cols-max gap-2 border p-2 bg-gray-100"
      css={{ width: "max-content" }}
    >
      {data &&
        data.map((message) => <Message key={message.id} message={message} />)}
    </div>
  )
}

const MessageDetail = ({ message }: { message: Message }) => {
  return (
    <div tw="bg-white p-4 border max-w-3xl z-50">
      <h1 tw="text-xl font-bold mb-3">{message.type}</h1>
      <div tw="font-mono mb-4">
        Stream Name: <span tw="ml-4">{message.stream_name}</span>
      </div>
      <DataTable title="Data" data={message.data} />

      {message.metadata && (
        <DataTable title="Metadata" data={message.metadata} />
      )}
    </div>
  )
}

const DataTable = ({ title, data }: { title: string; data: MessageData }) => (
  <div>
    <h2 tw="text-lg font-bold mb-2">{title}</h2>

    <table tw="font-mono mb-4">
      <tbody>
        {Object.entries(data).map(([key, value]) => (
          <tr tw="align-top" key={key}>
            <td tw="pr-4">{key}:</td>
            <td>
              <DataValue value={JSON.stringify(value, null, 2)} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

const clamp = css({
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
  textOverflow: "ellipsis",
})

const DataValue = ({ value }: { value: Value }) => {
  return (
    <div tw="w-auto break-all resize-none" css={clamp}>
      {value}
    </div>
  )
}

const Message = ({ message }: { message: Message }) => {
  const ref = React.useRef<HTMLDivElement>(null)
  const causationPosition = message.metadata?.causationMessageGlobalPosition

  const [showTooltip, setShowTooltip] = React.useState(false)
  const [
    referenceElement,
    setReferenceElement,
  ] = React.useState<HTMLElement | null>()
  const [popperElement, setPopperElement] = React.useState<HTMLElement | null>()
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "auto-start",
    modifiers: [
      {
        name: "offset",
        options: {
          offset: [5, 5],
        },
      },
    ],
  })

  return (
    <>
      <div
        ref={setReferenceElement}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div
          ref={ref}
          id={`message-${message.global_position}`}
          tw="border px-4 py-2 bg-white flex flex-col"
        >
          <div>{message.type}</div>
          <div tw="grid grid-cols-2 gap-x-2">
            <div>Pos:</div>
            <div tw="text-right">{message.position}</div>

            <div>GP:</div>
            <div tw="text-right">{message.global_position}</div>
          </div>
        </div>
      </div>

      {showTooltip && (
        <div
          ref={setPopperElement}
          style={styles.popper}
          tw="z-10"
          {...attributes.popper}
        >
          <MessageDetail message={message} />
        </div>
      )}

      {message.metadata && causationPosition && (
        <Xarrow
          strokeWidth={2}
          start={`message-${causationPosition}`}
          end={ref}
          startAnchor={{
            position: "bottom",
            offset: { rightness: 10, bottomness: 0 },
          }}
          endAnchor={{
            position:
              message.metadata.causationMessageStreamName ===
              message.stream_name
                ? "bottom"
                : "top",
            offset: { rightness: -10, bottomness: 0 },
          }}
        />
      )}
    </>
  )
}

export default function Home() {
  const router = useRouter()

  let streamNames = router.query.streamNames || ""
  if (!Array.isArray(streamNames)) {
    streamNames = streamNames.split(",")
  }

  return (
    <div tw="p-4 flex flex-col gap-8">
      {streamNames.map((streamName) => (
        <div key={streamName}>
          <div tw="z-10 absolute bg-white bg-opacity-75">{streamName}</div>
          <div tw="z-0 mt-8">
            <Stream streamName={streamName} />
          </div>
        </div>
      ))}
    </div>
  )
}