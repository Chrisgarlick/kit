{{-- kit section: call to action. Edit this, then run `kit section compile`. --}}
@props(['content' => [], 'variant' => 'default'])
<section class="kit-section-cta">
  <div class="kit-container">
    <div class="kit-cta-band">
      <div class="kit-cta-text">
@if($content['eyebrow'])
        <p class="kit-cta-eyebrow">{{ $content['eyebrow'] }}</p>
@endif
        <{{ kit_heading($content['heading_level']) }} class="kit-cta-title">{{ kit_rich($content['title']) }}</{{ kit_heading($content['heading_level']) }}>
        @if($content['lede'])
        <p class="kit-cta-lede">{{ $content['lede'] }}</p>
        @endif
      </div>
      @if(($content['action_label'] && $content['action_url']) || ($content['secondary_label'] && $content['secondary_url']) || $content['phone'])
      <div class="kit-cta-actions">
        @if($content['action_label'] && $content['action_url'])
        <a class="kit-button" data-size="lg" href="{{ kit_url($content['action_url']) }}">{{ $content['action_label'] }}</a>
        @endif
@if($content['secondary_label'] && $content['secondary_url'])
        <a class="kit-link kit-cta-secondary" data-variant="arrow" href="{{ kit_url($content['secondary_url']) }}">{{ $content['secondary_label'] }}</a>
@endif
        @if($content['phone'])
        <a class="kit-cta-phone" href="{{ kit_tel($content['phone']) }}"><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg><span>{{ $content['phone'] }}</span></a>
        @endif
      </div>
      @endif
    </div>
  </div>
</section>
