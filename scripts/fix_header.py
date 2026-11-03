p='src/components/Header.tsx'
s=open(p).read()

old_desktop = """              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Biryani, Tandoor, Curry..."
                className="w-full bg-stone-100/90 hover:bg-stone-100 focus:bg-white text-xs pl-9 pr-8 py-2 rounded-lg border border-stone-200 focus:border-amber-500 focus:outline-none transition-colors"
              />"""
new_desktop = """              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes..."
                className="w-full bg-[#292929] hover:bg-[#292929] focus:bg-[#292929] text-white text-xs pl-9 pr-8 py-2 rounded-lg border border-[#B89436] focus:border-[#F5C542] focus:outline-none transition-colors placeholder:text-stone-400"
              />"""
assert old_desktop in s
s=s.replace(old_desktop,new_desktop)

old_mobile = """              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes or categories..."
                className="w-full bg-stone-100 text-xs pl-9 pr-8 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-500"
                autoFocus
              />"""
new_mobile = """              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes..."
                className="w-full bg-[#292929] text-white text-xs pl-9 pr-8 py-2 rounded-lg border border-[#B89436] focus:outline-none focus:border-[#F5C542] placeholder:text-stone-400"
                autoFocus
              />"""
assert old_mobile in s
s=s.replace(old_mobile,new_mobile)

old_sort = """              {isCustomer && (
                <select"""
new_sort = """              {isCustomer && (
                <>
                  <span className="text-xs font-semibold text-stone-300 mr-1">Sort By</span>
                  <select"""
assert old_sort in s
s=s.replace(old_sort,new_sort)

old_close = """                  <option className="bg-[#303030] text-white" value="veg-first">Veg first</option>
                </select>
              )}"""
new_close = """                  <option className="bg-[#303030] text-white" value="veg-first">Veg first</option>
                </select>
                </>
              )}"""
assert old_close in s
s=s.replace(old_close,new_close)

open(p,'w').write(s)
print('done')
