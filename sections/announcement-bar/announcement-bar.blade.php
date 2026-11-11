{{-- kit section: announcement bar. Edit this, then run `kit section compile`. --}}
@props(['content' => [], 'variant' => 'default'])
<aside class="kit-section-announcement-bar" data-tone="{{ $content['tone'] }}" aria-label="Notice">
  <p class="kit-container kit-announce-inner">
    @if($content['icon'])
    {{ kit_icon($content['icon']) }}
    @endif
    <span>{{ $content['text'] }}</span>
    @if($content['link_label'] && $content['link_url'])
    <a href="{{ kit_url($content['link_url']) }}">{{ $content['link_label'] }}</a>
    @endif
  </p>
</aside>
