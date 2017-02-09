using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Database
{
    public interface IListRelation
    {
        string[] List { get; set; }
    }

    internal class ListItem<T>
    {
        public string Id { get; set; }
        public T Value { get; set; }
    }

    internal class ListRelationEnumerator<T> : IEnumerator<T>, IEnumerator
    {
        private List<ListItem<T>> _list;
        private int _cur;
        private Table<T> _table;
        public string[] List { get { return _list.Select(l => l.Id).ToArray(); } }
        public int Count { get { return _list.Count; } }

        public ListRelationEnumerator(Table<T> table, string[] idList)
        {
            _table = table;
            _list = idList.Select(id => new ListItem<T> { Id = id }).ToList();
            _cur = -1;
        }

        public T Current
        {
            get
            {
                return _list[_cur].Value;
            }
        }

        object IEnumerator.Current
        {
            get
            {
                return _list[_cur].Value;
            }
        }

        public void Dispose()
        {
            _list = null;
            _table = null;
        }

        public bool MoveNext()
        {
            if (_cur + 1 >= _list.Count)
                return false;

            var next = _list[_cur + 1];
            if (next.Value == null)
            {
                next.Value = _table.Get(next.Id);
            }

            _cur++;
            return true;
        }

        public void Reset()
        {
            _cur = -1;
        }

        public void Refresh()
        {
            _list.ForEach(l => l.Value = default(T));
        }

        public void Add(string id, T obj)
        {
            _list.Add(new ListItem<T>
            {
                Id = id,
                Value = obj
            });
        }
    }

    [JsonConverter(typeof(ListRelationJson))]
    public class ListRelation<T> : IListRelation, IEnumerable<T>
    {
        private string[] _list;
        private ListRelationEnumerator<T> _enumerator;
        public int Count { get { return _enumerator == null ? 0 : _enumerator.Count; } }

        public ListRelation()
        {
        }

        public string[] List
        {
            get
            {
                return _enumerator == null ? new string[] { }: _enumerator.List;
            }
            set
            {
                if (_list != null)
                    throw new Exception("The ListRelation can be set only one time!");
                _list = value;
            }
        }

        public ListRelation<T> Bind(Table<T> table)
        {
            if (_list == null)
                _list = new string[] { };
            _enumerator = new ListRelationEnumerator<T>(table, _list);
            return this;
        }

        public IEnumerator<T> GetEnumerator()
        {
            return _enumerator;
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return _enumerator;
        }

        public void Refresh()
        {
            _enumerator.Refresh();
        }

        public ListRelation<T> Add(string id, T obj)
        {
            _enumerator.Add(id, obj);
            return this;
        }
    }

    public class ListRelationJson : JsonConverter
    {
        public override bool CanConvert(Type objectType)
        {
            return objectType == typeof(ListRelation<>);
        }

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            var obj = Activator.CreateInstance(objectType) as IListRelation;
            obj.List = serializer.Deserialize<string[]>(reader);
            return obj;
        }

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            var list = value as IListRelation;
            serializer.Serialize(writer, list.List);
        }
    }
}