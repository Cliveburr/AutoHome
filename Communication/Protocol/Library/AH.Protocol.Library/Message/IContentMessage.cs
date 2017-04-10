using System.IO;

namespace AH.Protocol.Library.Message
{
    public interface IContentMessage
    {
        void GetStream(BinaryWriter stream);
        void Parse(BinaryReader stream);
    }
}