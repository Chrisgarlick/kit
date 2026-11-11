{{-- kit section: pricing. Edit this, then run `kit section compile`. --}}
@props(['content' => [], 'variant' => 'default'])
<section class="kit-section-pricing" data-background="{{ $content['background'] }}">
  <div class="kit-container">
    <div class="kit-section-head"@if($variant === 'centred') data-align="centre"@endif>
      <div class="kit-section-head-text">
        @if($content['eyebrow'])
        <p class="kit-section-head-eyebrow">{{ $content['eyebrow'] }}</p>
        @endif
        <{{ kit_heading($content['heading_level']) }} class="kit-section-head-title">{{ kit_rich($content['title']) }}</{{ kit_heading($content['heading_level']) }}>
        @if($content['lede'])
        <p class="kit-section-head-lede">{{ kit_rich($content['lede']) }}</p>
        @endif
      </div>
      @if($content['link_label'] && $content['link_url'])
      <a class="kit-link" data-variant="arrow" href="{{ kit_url($content['link_url']) }}">{{ $content['link_label'] }}</a>
      @endif
    </div>
    <ul class="kit-grid kit-pricing-grid" data-cols="{{ count($content['plans']) }}" data-min="sm" role="list">
      @foreach($content['plans'] as $plan)
      <li class="kit-card kit-price-card"{{ $plan['featured'] ? ' data-featured' : '' }}>
        <div class="kit-price-head">
          <h3 class="kit-price-name">{{ $plan['name'] }}</h3>
          @if($plan['featured'] && $plan['badge'])
          <span class="kit-price-badge">{{ $plan['badge'] }}</span>
          @endif
        </div>
        <p class="kit-price-amount"><span class="kit-price-figure">{{ $plan['price'] }}</span>@if($plan['per'])<span class="kit-price-per">{{ $plan['per'] }}</span>@endif</p>
        @if($plan['description'])
        <p class="kit-price-desc">{{ $plan['description'] }}</p>
        @endif
        @if(count($plan['features']))
        <ul class="kit-price-features" role="list">
          @foreach($plan['features'] as $feature)
          <li>{{ kit_icon('check') }}<span>{{ $feature['text'] }}</span></li>
          @endforeach
        </ul>
        @endif
        @if($plan['action_label'] && $plan['action_url'])
        <a class="kit-button kit-price-action" data-variant="{{ $plan['featured'] ? 'primary' : 'secondary' }}" href="{{ kit_url($plan['action_url']) }}">{{ $plan['action_label'] }}<span class="kit-vh">: {{ $plan['name'] }}</span></a>
        @endif
      </li>
      @endforeach
    </ul>
  </div>
</section>
