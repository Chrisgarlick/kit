{{-- kit section: services. Edit this, then run `kit section compile`. --}}
@props(['content' => [], 'variant' => 'default'])
<section class="kit-section-services" data-background="{{ $content['background'] }}">
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
    <ul class="kit-grid kit-services-grid" data-cols="{{ $content['columns'] }}" data-min="sm" role="list">
      @foreach($content['services'] as $service)
      <li class="kit-card kit-service-card">
        @if($service['icon'])
        <span class="kit-service-icon">{{ kit_icon($service['icon']) }}</span>
        @endif
        <h3 class="kit-service-title">{{ $service['title'] }}</h3>
        @if($service['text'])
        <p class="kit-service-text">{{ $service['text'] }}</p>
        @endif
        @if($service['proof'])
        <p class="kit-service-proof">{{ kit_icon('check') }}<span>{{ $service['proof'] }}</span></p>
        @endif
        @if($service['link_label'] && $service['link_url'])
        <a class="kit-link kit-service-link" data-variant="arrow" href="{{ kit_url($service['link_url']) }}">{{ $service['link_label'] }}<span class="kit-vh">: {{ $service['title'] }}</span></a>
        @endif
      </li>
      @endforeach
    </ul>
  </div>
</section>
