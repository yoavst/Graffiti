using System;
using System.Diagnostics;
using System.IO;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;


namespace GraffitiForVisio
{
    internal class NetworkController
    {
        private readonly string Host;
        private readonly int Port;
        private ClientWebSocket ws;

        public NetworkController(string host, int port)
        {
            Host = host;
            Port = port;
        }

        public async Task ConnectAndLoopAsync(NetworkCallback callback)
        {
            try
            {
                var uri = new Uri(string.Format("ws://{0}:{1}/", Host, Port));
                ws = new ClientWebSocket();
                ws.Options.KeepAliveInterval = TimeSpan.FromSeconds(3);

                var source = new CancellationTokenSource();
                source.CancelAfter(3000);

                await ws.ConnectAsync(uri, source.Token);


                Globals.Ribbons.Ribbon1.SetConnected();

                while (ws != null && ws.State == WebSocketState.Open)
                {
                    var res = await ReadAsync();
                    if (res == null)
                    {
                        continue;
                    }
                    var msg = BaseNetworkPush.Parse(res);
                    switch (msg)
                    {
                        case AddDataNetworkPush addData:
                            callback.OnAddData(addData);
                            break;
                        case UpdateNodesPush updateNodes:
                            callback.OnUpdateNodes(updateNodes);
                            break;
                        case AddDataBulkNetworkPush addDataBulk:
                            callback.OnAddDataBulk(addDataBulk);
                            break;
                    }

                }
            }
            catch (WebSocketException ex)
            {
                Globals.Ribbons.Ribbon1.SetErrorConnection();
                Debug.WriteLine(ex);
            }
            finally
            {
                await Close();
            }
        }

        public bool IsConnected
        {
            get
            {
                return ws != null && ws.State == WebSocketState.Open;
            }
        }

        public async Task Close()
        {
            if (ws != null)
            {
                try
                {
                    await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "Normal close", CancellationToken.None);
                } catch(ObjectDisposedException)
                {

                }
            }
            ws = null;
        }

        public async Task SendAsync(string s)
        {
            if (IsConnected)
                await ws.SendAsync(new ArraySegment<byte>(Encoding.UTF8.GetBytes(s)), WebSocketMessageType.Text, true, CancellationToken.None);
        }

        private async Task<string> ReadAsync()
        {
            WebSocketReceiveResult result;
            using (var ms = new MemoryStream())
            {
                do
                {
                    var messageBuffer = WebSocket.CreateClientBuffer(1024, 16);
                    result = await ws.ReceiveAsync(messageBuffer, CancellationToken.None);
                    if (result.MessageType == WebSocketMessageType.Close)
                    {
                        throw new WebSocketException("Socket is closed");
                    }
                    ms.Write(messageBuffer.Array, messageBuffer.Offset, result.Count);
                }
                while (!result.EndOfMessage);

                if (result.MessageType == WebSocketMessageType.Text)
                {
                    return Encoding.UTF8.GetString(ms.ToArray());
                }
            }
            return null;
        }
    }

    interface NetworkCallback
    {
        void OnAddData(AddDataNetworkPush push);
        void OnAddDataBulk(AddDataBulkNetworkPush addDataBulk);
        void OnUpdateNodes(UpdateNodesPush push);
    }
}
