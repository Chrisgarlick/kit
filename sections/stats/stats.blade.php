{{-- kit section: stats. Edit this, then run `kit section compile`. --}}
@props(['content' => [], 'variant' => 'default'])
<section class="kit-section-stats" data-tone="{{ $content['tone'] }}">
  <div class="kit-container">
    <dl class="kit-stats-list">
      @foreach($content['stats'] as $stat)
      <div class="kit-stats-item">
        <dt>{{ $stat['label'] }}</dt>
        <dd>{{ $stat['value'] }}</dd>
      </div>
      @endforeach
    </dl>
  </div>
</section>
