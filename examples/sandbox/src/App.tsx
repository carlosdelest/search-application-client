import React, { useEffect, useState } from 'react'
import SearchApplicationClient from '@elastic/search-application-client'
import './App.css'
import {SortFields} from "../../../src/types";

const request = SearchApplicationClient(
  'test-search',
    'https://b1edbb7ba03142b0883076b4b1c22495.europe-west1.gcp.cloud.es.io:443',
  'LV9Db2lJb0Iwa211Z2hqSndsMEc6SEZUbjVVUUhSXzJlM1VHeWZRQ3lYdw==',
  {
    facets: {
      color: {
        type: 'terms',
        size: 10,
        field: 'product_color.keyword',
      },
      stars: {
        type: 'terms',
        size: 5,
        field: 'stars',
      },
      category: {
        type: 'terms',
        size: 5,
        field: 'category',
      },
      locale: {
        type: 'terms',
        field: 'product_locale',
        size: 10,
        disjunctive: true,
      }
    },
  }
)

function Facets({ facets, addFilter, removeFilter, filters }: any) {
  if (!facets) {
    return null
  }
  return (
    <div className="md:w-1/4 bg-gray-100 p-4">
      {facets &&
        facets.map((facet: any) => {
          if (facet.name === 'imdbrating') {
            return (
              <div key={facet.name} className="pb-4">
                <h3 className="text-base font-semibold mb-2 uppercase">
                  {facet.name}
                </h3>
                <p>
                  Min: {facet.stats.min} Max: {facet.stats.max}
                </p>
              </div>
            )
          }
          return (
            <div key={facet.name} className="pb-4">
              <h3 className="text-base font-semibold mb-2 uppercase">
                {facet.name}
              </h3>
              {facet.entries.map((bucket: any) => {
                const isSelected =
                  filters[facet.name] &&
                  filters[facet.name].includes(bucket.value)
                return (
                  <ul key={bucket.value}>
                    <li
                      className={`pb-0.5 cursor-pointer ${
                        isSelected ? 'font-semibold' : ''
                      }`}
                      onClick={() => {
                        if (!isSelected) {
                          addFilter(facet.name, bucket.value)
                        } else {
                          removeFilter(facet.name, bucket.value)
                        }
                      }}
                    >
                      {bucket.value} ({bucket.count})
                    </li>
                  </ul>
                )
              })}
            </div>
          )
        })}
    </div>
  )
}


function App() {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [results, setResults] = useState<any>(null)
  const [filters, setFilters] = useState<any>({})
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  type Item = {
    stars: string;
    price: number;
  };

  type SortOrder = 'asc' | 'desc';

  const doSearch = async () => {
    const r = request()
        // .setSort(['_score'])
        .query(query)
        .setPageSize(12)
        .setFrom(12 * (page - 1))
        .addParameter('custom-parameter', 'custom-value')
        .setFilter({
          "bool": {
            "must": [
              {
                "exists": {
                  "field": "image"
                }
              },
              {
                "exists": {
                  "field": "price"
                }
              }
            ]
          }
        })

    if (sortBy != '') {
      r.setSort( [{ [sortBy]: sortOrder }])
    }

    for (const [key, value] of Object.entries(filters)) {
      r.addFacetFilter(key, value as string);
    }

    const results = await r.search()

    setResults(results)
  }

  function SortControls() {
    const handleSort = (criteria: string) => {
      setSortBy(criteria);
      doSearch();
    };

    const toggleSortOrder = () => {
      // Toggle between 'asc' and 'desc'
      const newSortOrder: SortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newSortOrder);

      // Re-sort using the current criteria and new sortOrder
      handleSort(sortBy);
    };

    return (
        <div>
          <div>
            <h2>Sort By:</h2>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-md" onClick={() => handleSort('stars')}>Stars</button>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-md" onClick={() => handleSort('price')}>Price</button>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-md" onClick={toggleSortOrder}>
              {sortOrder === 'asc' ? 'Descending' : 'Ascending'}
            </button>
          </div>
        </div>
    );
  }

    const handleSearch = async (e: any) => {
    e.preventDefault()
    setPage(1)
    doSearch()
  }

  useEffect(() => {
    doSearch()

    window.scroll({ top: 0, behavior: 'smooth' })
  }, [filters, page])

  return (
    <div className="flex flex-col md:flex-row">
      <Facets
        facets={results && results.facets}
        filters={filters}
        addFilter={(filter: any, value: any) => {
          const existingFilters = filters[filter] || []
          setFilters({
            ...filters,
            [filter]: [...existingFilters, value],
          })
          setPage(1)
        }}
        removeFilter={(filter: any, value: any) => {
          const existingFilters = filters[filter] || []
          setFilters({
            ...filters,
            [filter]: existingFilters.filter((v: any) => v !== value),
          })
          setPage(1)
        }}
      />

      <div className="md:w-3/4 p-4">
        <form onSubmit={handleSearch} className="w-full mb-4 flex space-x-2">
          <input
            placeholder="search"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            type="text"
            onChange={(e) => {
              e.preventDefault()
              setQuery(e.target.value)
            }}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
          >
            Search
          </button>
        </form>
        <div className="mt-4">
          <SortControls/>
        </div>
        <div className="mt-4">
          <p className="text-gray-500">{results?.hits?.total?.value} Results</p>
        </div>
        <div className="relative pt-10 xl:pt-0 mt-10 xl:mt-2">
          {results &&
            results.hits.hits.map((hit: any) => {
              return (
                  <div key={hit._id} className="flex font-sans">
                    <div className="flex-none w-48 relative">
                      <img src={hit._source.image} alt={hit._source.product_title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="flex-auto p-6">
                      <div className="flex flex-wrap">
                        <h1 className="flex-auto text-lg font-semibold text-slate-900">
                          {hit._source.product_title}
                        </h1>
                        <div className="text-lg font-semibold text-slate-500">
                          {hit._source.price}
                        </div>
                        <div className="w-full flex-none text-sm font-medium text-slate-700 mt-2" dangerouslySetInnerHTML={{ __html: hit._source.product_description }}>
                        </div>
                      </div>
                    </div>
                  </div>
              )
            })}
        </div>
        <div className="mt-4 flex justify-center gap-4">
          {page > 1 && (
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-md"
              onClick={() => setPage(page - 1)}
            >
              Prev Page
            </button>
          )}
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
            onClick={() => setPage(page + 1)}
          >
            Next Page
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
