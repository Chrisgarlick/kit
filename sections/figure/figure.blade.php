{{-- kit section: figure. Edit this, then run `kit section compile`. --}}
@props(['content' => [], 'variant' => 'default'])
<section class="kit-section-figure" data-tone="{{ $content['tone'] }}">
  <div class="kit-container">
    <figure class="kit-figure">
      <div class="kit-figure-frame">
@if($content['frame'] === 'browser')
        <div class="kit-figure-window" data-frame="browser">
          <div class="kit-figure-bar" aria-hidden="true">@if($content['frame_url'])<span class="kit-figure-url">{{ $content['frame_url'] }}</span>@endif</div>
@endif
@if($content['image'])
        <img class="kit-figure-media" src="{{ kit_url($content['image']['src']) }}" alt="{{ $content['image']['alt'] }}" @isset($content['image']['width'])width="{{ $content['image']['width'] }}" height="{{ $content['image']['height'] ?? '' }}" @endisset @isset($content['image']['srcset'])srcset="{{ $content['image']['srcset'] }}" sizes="100vw" @endisset loading="lazy">
@else
        <div class="kit-figure-media" data-empty>{{ kit_icon('image') }}</div>
@endif
@if($content['frame'] === 'browser')
        </div>
@endif
@if($content['proof_value'])
        <div class="kit-figure-proof">
@if($content['proof_label'])
          <p class="kit-figure-proof-label">{{ $content['proof_label'] }}</p>
@endif
          <p class="kit-figure-proof-value">{{ $content['proof_value'] }}</p>
@if($content['proof_note'])
          <p class="kit-figure-proof-note">{{ $content['proof_note'] }}</p>
@endif
        </div>
@endif
      </div>
@if($content['caption_left'] || $content['caption_right'])
      <figcaption class="kit-figure-caption">
@if($content['caption_left'])
        <span class="kit-figure-caption-left">{{ $content['caption_left'] }}</span>
@endif
@if($content['caption_right'])
        <span class="kit-figure-caption-right">{{ $content['caption_right'] }}</span>
@endif
      </figcaption>
@endif
    </figure>
  </div>
</section>
