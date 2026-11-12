{{-- kit section: footer. Edit this, then run `kit section compile`. --}}
@props(['content' => [], 'variant' => 'default'])
<footer class="kit-section-footer">
  <div class="kit-container">
    <div class="kit-footer-top">
      <div class="kit-footer-about">
        <p class="kit-footer-brand">
          @if($content['logo'])
          <img class="kit-footer-logo" src="{{ kit_url($content['logo']['src']) }}" alt="" @isset($content['logo']['width'])width="{{ $content['logo']['width'] }}" height="{{ $content['logo']['height'] ?? '' }}"@endisset>
          @else
          <span class="kit-footer-mark" aria-hidden="true"></span>
          @endif
          <span>{{ $content['brand_name'] }}</span>
        </p>
        @if($content['blurb'])
        <p class="kit-footer-blurb">{{ $content['blurb'] }}</p>
        @endif
      </div>
      @foreach($content['columns'] as $column)
      <nav class="kit-footer-column" aria-label="{{ $column['heading'] }}">
        <h2 class="kit-footer-heading">{{ $column['heading'] }}</h2>
        <ul role="list">
          @foreach($column['links'] as $link)
          <li><a href="{{ kit_url($link['url']) }}">{{ $link['label'] }}</a></li>
          @endforeach
        </ul>
      </nav>
      @endforeach
      @if($content['phone'] || $content['email'] || count($content['social']))
      <div class="kit-footer-column">
        <h2 class="kit-footer-heading">{{ $content['contact_heading'] }}</h2>
        <ul role="list">
          @if($content['phone'])
          <li><a href="{{ kit_tel($content['phone']) }}">{{ $content['phone'] }}</a></li>
          @endif
          @if($content['email'])
          <li><a href="{{ kit_mailto($content['email']) }}">{{ $content['email'] }}</a></li>
          @endif
        </ul>
        @if(count($content['social']))
        <ul class="kit-footer-social" role="list">
          @foreach($content['social'] as $profile)
          <li>
            <a href="{{ kit_url($profile['url']) }}" aria-label="{{ $profile['network'] === 'instagram' ? 'Instagram' : ($profile['network'] === 'facebook' ? 'Facebook' : ($profile['network'] === 'linkedin' ? 'LinkedIn' : ($profile['network'] === 'tiktok' ? 'TikTok' : 'YouTube'))) }}">
              @if($profile['network'] === 'instagram')
              <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></svg>
              @elseif($profile['network'] === 'facebook')
              <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              @elseif($profile['network'] === 'linkedin')
              <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              @elseif($profile['network'] === 'tiktok')
              <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="M9 12a4 4 0 1 0 4 4V2a5 5 0 0 0 5 5"/></svg>
              @else
              <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="M2.5 17a24 24 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24 24 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
              @endif
            </a>
          </li>
          @endforeach
        </ul>
        @endif
      </div>
      @endif
    </div>
    <div class="kit-footer-bottom">
      @if($content['small_print'])
      <p class="kit-footer-small">{{ $content['small_print'] }}</p>
      @endif
      @if(count($content['legal']))
      <ul class="kit-footer-legal" role="list">
        @foreach($content['legal'] as $link)
        <li><a href="{{ kit_url($link['url']) }}">{{ $link['label'] }}</a></li>
        @endforeach
      </ul>
      @endif
    </div>
  </div>
@if($content['wordmark'])
  <p class="kit-footer-wordmark" aria-hidden="true">{{ $content['wordmark'] }}</p>
@endif
</footer>
