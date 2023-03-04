using Newtonsoft.Json;
using System.Collections.Generic;
using System.Linq;

namespace GraffitiForVisio
{
    internal class Node
    {
        [JsonProperty(PropertyName = "address")]
        public string Address { get; set; }

        [JsonProperty(PropertyName = "project")]
        public string Project { get; set; }

        [JsonIgnore]
        public string Label { 
            get
            {
                return (string) Properties["label"];
            }
        }

        [JsonIgnore]
        public Theme Theme
        {
            get
            {
                if (Properties.ContainsKey("theme")) {
                    var index = int.Parse(Properties["theme"].ToString());
                    if (index >= 1 && (index - 1) <= Themes.Default.Length)
                    {
                        return Themes.Default[index - 1];
                    }
                 }
                return Themes.Default[0];
            }
        }

        public List<ComputedProperty> computedProperties { get; set; }

        [JsonExtensionData]
        public Dictionary<string, object> Properties { get; set; }

        [JsonIgnore]
        private bool IsResolved;

        public Node Resolve()
        {
            var props = new Dictionary<string, object>(Properties)
            {
                ["address"] = Address,
                ["project"] = Project,
                ["isNodeTarget"] = Project
            };

            foreach (var prop in computedProperties)
            {
                var propValue = string.Format(prop.Format, prop.Replacements.Select(x => props[x]).ToArray());
                props[prop.Name] = propValue;
            }


            return new Node { Address = Address, Project = Project, Properties = props,
                computedProperties = new List<ComputedProperty>(), IsResolved = true
            };
        }

        public bool Match(List<List<string>> selection)
        {
            if (!IsResolved) return Resolve().Match(selection);

            foreach (var condition in selection)
            {
                var name = condition[0];
                var value = condition[1];

                if (!Properties.ContainsKey(name) || (value != Properties[name].ToString()))
                {
                    return false;
                }
            }
            return true;
        }
    }

    internal class ComputedProperty
    {
        [JsonProperty(PropertyName = "name")]
        public string Name { get; set; }

        [JsonProperty(PropertyName = "format")]
        public string Format { get; set; }

        [JsonProperty(PropertyName = "replacements")]
        public List<string> Replacements { get; set; }
    }
}
