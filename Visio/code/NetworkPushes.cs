using Newtonsoft.Json;
using System;
using System.Collections.Generic;

namespace GraffitiForVisio
{
    internal class BaseNetworkPush
    {
        [JsonProperty(PropertyName ="type")]
        public string Type { get; set; }

        public static BaseNetworkPush Parse(string json)
        {
            var baseNetworkPush = JsonConvert.DeserializeObject<BaseNetworkPush>(json);
            if (baseNetworkPush.Type == "addData")
            {
                return JsonConvert.DeserializeObject<AddDataNetworkPush>(json);
            } else if (baseNetworkPush.Type == "updateNodes")
            {
                return JsonConvert.DeserializeObject<UpdateNodesPush>(json);
            } else
            {
                return JsonConvert.DeserializeObject<AddDataBulkNetworkPush>(json);
            }
        }
    }

    internal class AddDataNetworkPush : BaseNetworkPush
    {
        [JsonProperty(PropertyName = "node")]
        public Node Node { get; set; }
    }

    internal class AddDataBulkNetworkPush : BaseNetworkPush
    {
        [JsonProperty(PropertyName = "nodes")]
        public List<Node> Nodes { get; set; }
    }

    internal class UpdateNodesPush : BaseNetworkPush
    {
        [JsonProperty(PropertyName = "selection")]
        public List<List<String>> Selection { get; set; }

        [JsonProperty(PropertyName = "update")]
        public Dictionary<string, string> Update { get; set; }
    }
}
