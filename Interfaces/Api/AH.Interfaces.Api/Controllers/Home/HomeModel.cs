namespace AH.Interfaces.Api.Controllers.Home
{
    public class InitRequest
    {
        public DateTime? CacheDate { get; set; }
    }

    public class InitResponse
    {
        public DateTime CacheDate { get; set; }
        public byte[] FullImage { get; set; }
        public int GlobalMargin { get; set; }
        public List<InitResponseArea> Areas { get; set; }
    }

    public class InitResponseArea
    {
        public byte? UID { get; set; }
        public string? Name { get; set; }
        public string? Image { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
    }
}
