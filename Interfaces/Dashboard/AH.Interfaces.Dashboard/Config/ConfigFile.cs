using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Serialization;

namespace AH.Interfaces.Dashboard.Config
{
    public static class ConfigFile
    {
        public static ConfigData Data { get; private set; }

        private static string FilePath
        {
            get
            {
                return Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Dashboard.config");
            }
        }

        public static void Load()
        {
            if (File.Exists(FilePath))
            {
                using (var stream = File.OpenRead(FilePath))
                {
                    var serializer = new XmlSerializer(typeof(ConfigData));
                    Data = serializer.Deserialize(stream) as ConfigData;
                }
            }
            else
            {
                Data = new ConfigData();
            }
            Data.InitializeData();
        }

        public static void Save()
        {
            using (var writer = new StreamWriter(FilePath))
            {
                var serializer = new XmlSerializer(typeof(ConfigData));
                serializer.Serialize(writer, Data);
                writer.Flush();
            }
        }
    }
}