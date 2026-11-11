{{-- kit section: trust strip. Edit this, then run `kit section compile`. --}}
@props(['content' => [], 'variant' => 'default'])
<section class="kit-section-trust-strip" data-background="{{ $content['background'] }}">
  <div class="kit-container kit-trust-row">
    @if($content['label'])
    <p class="kit-trust-label">{{ $content['label'] }}</p>
    @endif
    <ul class="kit-trust-logos" role="list">
      @foreach($content['logos'] as $logo)
      <li>
        @if($logo['url'])
        <a class="kit-trust-logo" href="{{ kit_url($logo['url']) }}">
        @else
        <span class="kit-trust-logo">
        @endif
          @if($logo['image'])
          <img src="{{ kit_url($logo['image']['src']) }}" alt="{{ $logo['name'] }}" @isset($logo['image']['width'])width="{{ $logo['image']['width'] }}" height="{{ $logo['image']['height'] ?? '' }}" @endisset loading="lazy">
          @else
          <span class="kit-trust-name">{{ $logo['name'] }}</span>
          @endif
        @if($logo['url'])
        </a>
        @else
        </span>
        @endif
      </li>
      @endforeach
    </ul>
  </div>
</section>
