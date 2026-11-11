{{-- kit section: product page. Edit this, then run `kit section compile`. --}}
@props(['content' => [], 'variant' => 'default'])
<section class="kit-section-product-page">
  <div class="kit-container kit-pp-inner">
    <div class="kit-pp-gallery">
      <div class="kit-pp-slides" tabindex="0" role="region" aria-label="Photos">
        @foreach($content['images'] as $i => $photo)
        <figure class="kit-pp-slide" id="kit-product-photo-{{ $i + 1 }}">
          @if($photo['image'])
          <img src="{{ kit_url($photo['image']['src']) }}" alt="{{ $photo['image']['alt'] }}" @isset($photo['image']['width'])width="{{ $photo['image']['width'] }}" height="{{ $photo['image']['height'] ?? '' }}" @endisset{{ $i === 0 ? ' fetchpriority="high"' : ' loading="lazy"' }}>
          @else
          <span class="kit-pp-placeholder">{{ kit_icon('box') }}</span>
          @endif
        </figure>
        @endforeach
        @if(!count($content['images']))
        <figure class="kit-pp-slide"><span class="kit-pp-placeholder">{{ kit_icon('box') }}</span></figure>
        @endif
      </div>
      @isset($content['images'][1])
      <ul class="kit-pp-thumbs" role="list">
        @foreach($content['images'] as $i => $photo)
        <li><a href="#kit-product-photo-{{ $i + 1 }}">@if($photo['image'])<img src="{{ kit_url($photo['image']['src']) }}" alt="" loading="lazy">@else<span class="kit-pp-placeholder"></span>@endif<span class="kit-vh">Photo {{ $i + 1 }}</span></a></li>
        @endforeach
      </ul>
      @endisset
    </div>
    <div class="kit-pp-info">
      @if(count($content['crumbs']))
      <nav aria-label="Breadcrumb">
        <ol class="kit-breadcrumbs">
          @foreach($content['crumbs'] as $i => $crumb)
          <li>@if($i === count($content['crumbs']) - 1)<a href="{{ kit_url($crumb['url']) }}" aria-current="page">{{ $crumb['label'] }}</a>@else<a href="{{ kit_url($crumb['url']) }}">{{ $crumb['label'] }}</a>@endif</li>
          @endforeach
        </ol>
      </nav>
      @endif
      <{{ kit_heading($content['heading_level']) }} class="kit-pp-name">{{ $content['name'] }}</{{ kit_heading($content['heading_level']) }}>
      @if($content['rating'])
      <p class="kit-pp-rating">{{ kit_icon('star') }}<span><strong>{{ $content['rating'] }}</strong><span class="kit-vh"> out of 5</span>@if($content['reviews_label']) · @if($content['reviews_url'])<a href="{{ kit_url($content['reviews_url']) }}">{{ $content['reviews_label'] }}</a>@else{{ $content['reviews_label'] }}@endif @endif</span></p>
      @endif
      <p class="kit-pp-price">@if($content['was_price'])<span class="kit-pp-now"><span class="kit-vh">Now </span>{{ $content['price'] }}</span> <s class="kit-pp-was"><span class="kit-vh">was </span>{{ $content['was_price'] }}</s>@else{{ $content['price'] }}@endif</p>
      @if($content['description'])
      <div class="kit-pp-description">{{ kit_paragraphs($content['description']) }}</div>
      @endif
      <form class="kit-pp-buy" method="post" action="{{ kit_url($content['form_action']) }}">
        @if($content['product_id'])
        <input type="hidden" name="product" value="{{ $content['product_id'] }}">
        @endif
        @foreach($content['options'] as $option)
        <fieldset class="kit-pp-option" data-kind="{{ $option['kind'] }}">
          <legend>{{ $option['name'] }}</legend>
          <div class="kit-pp-choices">
            @foreach($option['values'] as $value)
            <label class="kit-pp-choice">
              <input type="radio" name="options[{{ $option['name'] }}]" value="{{ $value['label'] }}"{{ $value['selected'] ? ' checked' : '' }}{{ $value['unavailable'] ? ' disabled' : '' }}>
              @if($option['kind'] === 'swatches')
              <svg class="kit-pp-swatch" viewBox="0 0 36 36" width="36" height="36" aria-hidden="true"><circle cx="18" cy="18" r="17.5" fill="{{ kit_colour($value['colour']) }}"/></svg>
              @endif
              <span class="{{ $option['kind'] === 'swatches' ? 'kit-vh' : 'kit-pp-choice-label' }}">{{ $value['label'] }}@if($value['unavailable']) (out of stock)@endif</span>
            </label>
            @endforeach
          </div>
        </fieldset>
        @endforeach
        <div class="kit-pp-actions">
          @if($content['quantity'] && !$content['sold_out'])
          <div class="kit-field kit-pp-qty">
            <label class="kit-vh" for="kit-pp-qty">Quantity</label>
            <input class="kit-input" id="kit-pp-qty" type="number" name="quantity" value="1" min="1" max="99" inputmode="numeric">
          </div>
          @endif
          @if($content['sold_out'])
          <button class="kit-button kit-pp-add" data-variant="secondary" data-size="lg" type="submit" disabled>Sold out</button>
          @else
          <button class="kit-button kit-pp-add" data-variant="primary" data-size="lg" type="submit">{{ kit_icon('bag') }}{{ $content['add_label'] }}</button>
          @endif
        </div>
      </form>
      @if(count($content['perks']))
      <ul class="kit-pp-perks" role="list">
        @foreach($content['perks'] as $perk)
        <li>{{ kit_icon($perk['icon']) }}<span>{{ $perk['text'] }}</span></li>
        @endforeach
      </ul>
      @endif
      @if(count($content['details']))
      <div class="kit-pp-details">
        @foreach($content['details'] as $detail)
        <details class="kit-accordion">
          <summary>{{ $detail['title'] }}</summary>
          <div class="kit-accordion-body">{{ kit_paragraphs($detail['body']) }}</div>
        </details>
        @endforeach
      </div>
      @endif
    </div>
  </div>
</section>
