{{-- kit section: product grid. Edit this, then run `kit section compile`. --}}
@props(['content' => [], 'variant' => 'default'])
<section class="kit-section-product-grid">
  <div class="kit-container">
    <div class="kit-shop-head">
      <div class="kit-shop-title">
        @if(count($content['crumbs']))
        <nav aria-label="Breadcrumb">
          <ol class="kit-breadcrumbs">
            @foreach($content['crumbs'] as $i => $crumb)
            <li>@if($i === count($content['crumbs']) - 1)<a href="{{ kit_url($crumb['url']) }}" aria-current="page">{{ $crumb['label'] }}</a>@else<a href="{{ kit_url($crumb['url']) }}">{{ $crumb['label'] }}</a>@endif</li>
            @endforeach
          </ol>
        </nav>
        @endif
        <{{ kit_heading($content['heading_level']) }} class="kit-shop-heading">{{ $content['title'] }}</{{ kit_heading($content['heading_level']) }}>
      </div>
      @if($content['count'])
      <p class="kit-shop-count">{{ $content['count'] }}</p>
      @endif
    </div>
    @if(count($content['categories']) || count($content['sort_options']))
    <div class="kit-shop-tools">
      @if(count($content['categories']))
      <nav class="kit-shop-filters" aria-label="Categories">
        <ul role="list">
          @foreach($content['categories'] as $category)
          <li><a class="kit-shop-filter" href="{{ kit_url($category['url']) }}"{{ $category['current'] ? ' aria-current="page"' : '' }}>{{ $category['label'] }}</a></li>
          @endforeach
        </ul>
      </nav>
      @endif
      @if(count($content['sort_options']))
      <form class="kit-shop-sort" method="get" action="{{ kit_url($content['sort_url']) }}">
        <label class="kit-vh" for="kit-shop-sort">Sort by</label>
        <select class="kit-select" id="kit-shop-sort" name="{{ $content['sort_name'] }}">
          @foreach($content['sort_options'] as $option)
          <option value="{{ $option['value'] }}"{{ $option['current'] ? ' selected' : '' }}>Sort: {{ $option['label'] }}</option>
          @endforeach
        </select>
        <button class="kit-button" data-variant="secondary" type="submit">Sort</button>
      </form>
      @endif
    </div>
    @endif
    <ul class="kit-grid kit-shop-grid" data-cols="{{ $content['columns'] }}" data-min="xs" role="list">
      @foreach($content['products'] as $product)
      <li class="kit-product-card"{{ $product['badge'] === 'sold-out' ? ' data-sold-out' : '' }}>
        <div class="kit-product-media">
          @if($product['image'])
          <img src="{{ kit_url($product['image']['src']) }}" alt="" @isset($product['image']['width'])width="{{ $product['image']['width'] }}" height="{{ $product['image']['height'] ?? '' }}" @endisset loading="lazy">
          @else
          <span class="kit-product-placeholder">{{ kit_icon('box') }}</span>
          @endif
          @if($product['badge'] === 'sale')
          <span class="kit-product-badge" data-badge="sale">Sale</span>
          @elseif($product['badge'] === 'sold-out')
          <span class="kit-product-badge" data-badge="sold-out">Sold out</span>
          @elseif($product['badge'] === 'new')
          <span class="kit-product-badge" data-badge="new">New</span>
          @endif
          @if($product['add_url'] && $product['badge'] !== 'sold-out')
          <a class="kit-product-add" href="{{ kit_url($product['add_url']) }}">{{ kit_icon('bag') }}<span>{{ $product['add_label'] }}</span><span class="kit-vh">: {{ $product['name'] }}</span></a>
          @endif
        </div>
        <h3 class="kit-product-name">@if($product['url'])<a class="kit-product-link" href="{{ kit_url($product['url']) }}">{{ $product['name'] }}</a>@else{{ $product['name'] }}@endif</h3>
        <p class="kit-product-price">@if($product['was_price'])<span class="kit-product-now"><span class="kit-vh">Now </span>{{ $product['price'] }}</span> <s class="kit-product-was"><span class="kit-vh">was </span>{{ $product['was_price'] }}</s>@else{{ $product['price'] }}@endif</p>
      </li>
      @endforeach
    </ul>
  </div>
</section>
