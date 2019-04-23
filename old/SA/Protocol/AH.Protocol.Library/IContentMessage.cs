using System.IO;

namespace AH.Protocol.Library
{
    public interface IContentMessage
    {
        MessageType Type { get; }
        void Write(BinaryWriter stream);
        void Read(BinaryReader stream);
    }
}