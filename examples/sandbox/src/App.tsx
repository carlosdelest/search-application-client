import React, { useEffect, useState } from 'react'
import SearchApplicationClient from '@elastic/search-application-client'
import './App.css'

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

  const doSearch = async () => {
    const r = request()
      // .setSort(['_score'])
      .query(query)
      .setPageSize(12)
      .setFrom(12 * (page - 1))
      .addParameter('custom-parameter', 'custom-value')

    for (const [key, value] of Object.entries(filters)) {
      r.addFacetFilter(key, value as string)
    }

    const results = await r.search()

    setResults(results)
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
          <p className="text-gray-500">{results?.hits?.total?.value} Results</p>
        </div>
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
          {results &&
            results.hits.hits.map((hit: any) => {
              return (
                <div
                  key={hit._id}
                  className="md:flex"
                >
                  {/*
                  <div className="md:shrink-0" >
                  <img
                    src={hit._source.product_title}
                    alt={hit._source.product_title}
                    className="mb-4 rounded-lg"
                  />

                  </div>
                  */}
                  <div className="p-8">
                    <h3 className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">{hit._source.product_title}</h3>
                    <p className="mt-1 text-lg leading-tight font-medium text-black hover:underline" dangerouslySetInnerHTML={{ __html: hit._source.product_description }} />
                    <p className="mt-2 text-slate-500"dangerouslySetInnerHTML={{ __html: hit._source.product_bullet_point }} />
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
