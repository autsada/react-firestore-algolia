import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import algoliasearch from 'algoliasearch'
// import { InstantSearch, SearchBox, Hits } from 'react-instantsearch-dom'

import './App.css'
import Tab from './Tab'
import { Product } from './data'
import { firestore } from './firebase'

export type TabName = 'Clothing' | 'Shoes' | 'Watches' | 'Accessories' | 'All'
const tabNames: TabName[] = [
  'Clothing',
  'Shoes',
  'Watches',
  'Accessories',
  'All',
]

const searchClient = algoliasearch(
  process.env.REACT_APP_ALGOLIA_APP_ID!,
  process.env.REACT_APP_ALGOLIA_SEARCH_KEY!
)

const searchIndex = searchClient.initIndex('products')

function App() {
  const [activeTab, setActiveTab] = useState<TabName>('All')
  const [displayedProducts, setDisplayedProducts] = useState<Product[] | null>()
  const [productData, setProductData] = useState<Omit<Product, 'id'>>({
    title: '',
    description: '',
    image: '',
    category: 'Clothing',
  })
  const [products, setProducts] = useState<Product[] | null>(null)
  const [searchText, setSearchText] = useState('')
  const [searchResult, setSearchResult] = useState<any>(null)

  const onSelectTab = (tab: TabName) => setActiveTab(tab)

  useEffect(() => {
    if (activeTab === 'All') {
      setDisplayedProducts(products)
    } else {
      if (!products) return

      const filteredProducts = products.filter(
        (prod) => prod.category === activeTab
      )

      setDisplayedProducts(filteredProducts)
    }
  }, [activeTab, products])

  useEffect(() => {
    const unsubcribe = firestore.collection('products').onSnapshot({
      next: (snapshots) => {
        const data = snapshots.docs.map((doc) => {
          const product = {
            id: doc.id,
            ...doc.data(),
          } as Product

          return product
        })

        setProducts(data)
      },
      error: (error) => console.log(error),
    })

    return () => unsubcribe()
  }, [])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const prodData = {
      [e.target.name]: e.target.value,
    } as Omit<Product, 'id'>

    setProductData((prev) => ({ ...prev, ...prodData }))
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Submit the product data to firestore
    firestore
      .collection('products')
      .add(productData)
      .then(() => {
        console.log('The product is added.')
        setProductData({
          title: '',
          description: '',
          image: '',
          category: 'Clothing',
        })
      })
      .catch((error) => console.log(error))
  }

  const handleSearchText = (e: ChangeEvent<HTMLInputElement>) =>
    setSearchText(e.target.value)

  const handleSearch = async (queryText: string) => {
    const result = await searchIndex.search(queryText)

    setSearchResult(result.hits)
  }

  useEffect(() => {
    if (!searchText) setSearchResult(null)
  }, [searchText])

  return (
    <div className='App'>
      <div>
        <form className='add-product' onSubmit={handleSubmit}>
          <label htmlFor='Title'>
            Title
            <input
              type='text'
              name='title'
              value={productData.title}
              onChange={handleChange}
            />
          </label>
          <label htmlFor='Description'>
            Description
            <input
              type='text'
              name='description'
              value={productData.description}
              onChange={handleChange}
            />
          </label>
          <label htmlFor='Image'>
            Image
            <input
              type='text'
              name='image'
              value={productData.image}
              onChange={handleChange}
            />
          </label>
          <label htmlFor='Category'>
            Category
            <input
              type='text'
              name='category'
              value={productData.category}
              onChange={handleChange}
            />
          </label>
          <button type='submit'>Add</button>
        </form>
      </div>

      <div className='tab-lists'>
        {tabNames.map((name) => (
          <Tab
            key={name}
            activeTab={activeTab}
            name={name}
            onSelectTab={onSelectTab}
          />
        ))}
      </div>

      {/* <InstantSearch searchClient={searchClient} indexName='products'> */}
      <div className='search'>
        <input
          type='text'
          placeholder='Search'
          value={searchText}
          onChange={handleSearchText}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch(searchText)
          }}
        />
        {/* <SearchBox /> */}
      </div>

      {/* <Hits hitComponent={Hit} /> */}

      <div className='tab-content'>
        {searchResult && searchResult.length > 0 ? (
          searchResult.map((prod: any) => (
            <div className='content' key={prod.objectID}>
              <img src={prod.image} alt={prod.id} width={200} />
              <h3>{prod.title}</h3>
              <p>{prod.description}</p>
            </div>
          ))
        ) : !displayedProducts || displayedProducts.length === 0 ? (
          <h2>No product.</h2>
        ) : (
          displayedProducts?.map((prod) => (
            <div className='content' key={prod.id}>
              <img src={prod.image} alt={prod.id} width={200} />
              <h3>{prod.title}</h3>
              <p>{prod.description}</p>
            </div>
          ))
        )}
      </div>
      {/* </InstantSearch> */}
    </div>
  )
}

export default App

// const Hit = ({ hit }: { hit: Product }) => {
//   return (
//     <div className='content' key={hit.id}>
//       <img key={hit.id} src={hit.image} alt={hit.id} width={200} />
//       <h3>{hit.title}</h3>
//       <p>{hit.description}</p>
//     </div>
//   )
// }
